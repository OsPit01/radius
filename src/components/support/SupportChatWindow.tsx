import { useEffect, useRef, useState } from 'react';

import { useSession } from 'next-auth/react';

import { ChatTextarea } from '@/components/chat/ChatTextarea';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Chat, Close, Send } from '@/components/icons';
import { api, type RouterOutputs } from '@/trpc/react';

type SupportChatWindowProps = {
    /** Закрыть окно. Показано/скрыто решает кнопка (SupportChatButton) —
     *  окно рендерится только когда открыто, поэтому свой open ему не нужен. */
    onClose: () => void;
};

/** Заметка о смене оператора в ленте («подключился» / «вышел»). */
type OperatorNote = {
    id: number;
    kind: 'join' | 'leave';
    text: string;
    /** id сообщения, ПОСЛЕ которого встаёт заметка; null — в начало ленты. */
    afterMessageId: number | null;
};

/** Элемент ленты: либо пузырь сообщения, либо заметка о смене оператора. */
type FlowItem =
    | { kind: 'message'; row: RouterOutputs['support']['messages'][number] }
    | { kind: 'note'; note: OperatorNote };

/**
 * Окно чата поддержки для ПОЛЬЗОВАТЕЛЯ (плавающий виджет).
 * Вся логика беседы живёт здесь; кнопка с бейджем — в SupportChatButton.
 *
 * Один источник правды — запрос myTicket: последняя заявка юзера + её статус
 * + кто из админов ведёт. Опрос каждые 5 сек: админ взял заявку или закрыл её —
 * виджет сам обновит подпись сверху.
 */
export function SupportChatWindow({ onClose }: SupportChatWindowProps) {
    const utils = api.useUtils();
    const { data: session } = useSession();
    const myId = session?.user?.id ?? '';
    const [text, setText] = useState('');

    // ===== Создание заявки — ЛЕНИВОЕ =====
    // Вызывается ТОЛЬКО при первой отправке сообщения (в handleSend),
    // когда у пользователя ещё НЕТ ни одной заявки.
    const openTicket = api.support.openOrGetTicket.useMutation();

    // ===== Моя беседа («подглядывание», БЕЗ создания) =====
    const { data: myTicket } = api.support.myTicket.useQuery(undefined, {
        refetchInterval: 5000,
    });

    // ===== Сообщения моей беседы (5-секундный опрос, пока есть заявка) =====
    // enabled по id, а НЕ по myTicket !== null: myTicket бывает ещё и undefined
    // (пока запрос не отработал), и тогда запрос летел бы с id:0 →
    // «Заявка не найдена» каждые 5 секунд.
    const { data: messages } = api.support.messages.useQuery(
        { id: myTicket?.id ?? 0 },
        { enabled: myTicket?.id !== undefined, refetchInterval: 5000 },
    );

    const sendMessage = api.support.send.useMutation({
        onSuccess: () => {
            void utils.support.messages.invalidate();
            // Написали в закрытую заявку → сервер её переоткрыл:
            // подтягиваем свежий статус, чтобы подпись сверху обновилась сразу.
            void utils.support.myTicket.invalidate();
        },
    });

    // Юзер открыл беседу = прочитал ответы поддержки: чужие сообщения → isRead.
    // После этого бейдж на кнопке должен погаснуть → инвалидируем счётчик
    // (кэш react-query общий, кнопка увидит обновление сама).
    const markRead = api.support.markRead.useMutation({
        onSuccess: () => void utils.support.unreadCount.invalidate(),
    });

    // Когда беседа приезжает с сервера — помечаем ответы поддержки прочитанными.
    // lastMarkedRef: помечаем только при СМЕНЕ id заявки, а не на каждый
    // 5-секундный рефетч — иначе мутация улетала бы в цикле каждые 5 сек.
    const lastMarkedRef = useRef<number | null>(null);
    useEffect(() => {
        if (myTicket && lastMarkedRef.current !== myTicket.id) {
            lastMarkedRef.current = myTicket.id;
            markRead.mutate({ id: myTicket.id });
        }
    }, [myTicket, markRead]);

    const handleSend = async () => {
        // Guard'ы: пустой текст и «уже отправляем» (двойной Enter/клик).
        if (!text.trim() || sendMessage.isPending) {
            return;
        }
        // Ленивое создание: заявка рождается ТОЛЬКО вместе с первым сообщением.
        // Если заявка закрыта — она переоткроется НА СЕРВЕРЕ (в send):
        // беседа у пользователя одна и продолжается в той же заявке.
        let id = myTicket?.id ?? null;
        if (id === null) {
            const ticket = await openTicket.mutateAsync();
            if (!ticket) {
                return;
            }
            id = ticket.id;
            // Сразу подтягиваем свежую заявку, чтобы сообщения загрузились.
            void utils.support.myTicket.invalidate();
        }
        await sendMessage.mutateAsync({ id, text: text.trim() });
        setText('');
    };

    // Статусные подписи:
    // — «Оператор: Имя» (строка под шапкой) — когда админ ведёт заявку;
    // — «Ваше обращение закрыто» (там же) — когда заявка закрыта;
    // — «Оператор скоро ответит» — НЕ постоянная строка, а разовая реакция
    //   на отправку: показывается в конце ленты, пока последнее сообщение —
    //   моё (я написал и жду ответа). Ответил оператор → подпись исчезает.
    // Имя оператора: firstName (настоящее имя), иначе name (у легаси там ник
    // или полное имя из OAuth), иначе email. Фамилию в подпись не тянем.
    const operatorName =
        myTicket?.assignedAdmin?.firstName ?? myTicket?.assignedAdmin?.name ?? myTicket?.assignedAdmin?.email ?? null;
    const isClosed = myTicket?.status === 'closed';
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : undefined;
    const isWaiting = myTicket?.status === 'open' && !operatorName && lastMessage?.message.senderId === myId;

    // ===== Разовые заметки о смене оператора (строки в ленте) =====
    // Сравниваем оператора между 5-секундными опросами myTicket:
    // был null → появился: «Оператор Имя подключился к чату» (ОДИН раз);
    // был → стал null: «Оператор Имя вышел из чата»;
    // сменился Иван → Пётр (передача): только «Иван вышел из чата»,
    // «подключился» при передаче НЕ показываем.
    // Каждая заметка ПРИВЯЗАНА к сообщению, после которого произошло
    // событие (afterMessageId): приходят новые сообщения — заметка
    // остаётся на своём месте, а не «ползёт» перед каждым новым.
    const [operatorNotes, setOperatorNotes] = useState<OperatorNote[]>([]);
    const noteCounterRef = useRef(0);
    const prevOperatorRef = useRef<string | null | undefined>(undefined);
    // id последнего сообщения из ПРЕДЫДУЩЕГО рендера — якорь для заметки.
    // Обновляющий эффект объявлен ПОСЛЕ эффекта оператора: при смене
    // оператора тот читает ещё не перезаписанное (прошлое) значение.
    const prevLastMessageIdRef = useRef<number | null>(null);
    useEffect(() => {
        const current = operatorName;
        // Первое значение — базовая линия: оператор был назначен ДО открытия
        // окна, а не прямо сейчас, поэтому «подключился» не показываем.
        if (prevOperatorRef.current === undefined) {
            prevOperatorRef.current = current;
            return;
        }
        const prev = prevOperatorRef.current;
        prevOperatorRef.current = current;
        if (prev === current) {
            return;
        }
        const next: { kind: 'join' | 'leave'; text: string }[] = [];
        if (prev) {
            next.push({ kind: 'leave', text: `Оператор ${prev} вышел из чата` });
        } else if (current) {
            // «Подключился» — только при ЧИСТОМ присоединении (никто не выходил).
            next.push({ kind: 'join', text: `Оператор ${current} подключился к чату` });
        }
        if (next.length > 0) {
            const startId = noteCounterRef.current;
            noteCounterRef.current += next.length;
            // Якорь — последнее сообщение ДО события (из прошлого рендера).
            const afterMessageId = prevLastMessageIdRef.current;
            setOperatorNotes((existing) => [
                ...existing,
                ...next.map((note, index) => ({ id: startId + index + 1, afterMessageId, ...note })),
            ]);
        }
    }, [operatorName]);

    // Обновляем якорь ПОСЛЕ эффекта оператора (см. комментарий выше).
    useEffect(() => {
        prevLastMessageIdRef.current = lastMessage?.message.id ?? null;
    }, [lastMessage?.message.id]);

    // Пузырь сообщения (без key — key проставляет карта ленты).
    // senderName — только имя (без фамилии): подписи над сообщениями
    // в виджете короткие, как и строка «Оператор: Имя».
    const renderBubble = (row: RouterOutputs['support']['messages'][number]) => (
        <MessageBubble
            text={row.message.text}
            isMine={row.message.senderId === myId}
            sender={row.sender}
            senderName={row.sender ? (row.sender.firstName ?? row.sender.name ?? undefined) : undefined}
            createdAt={row.message.createdAt}
            compact
        />
    );

    // Лента в хронологическом порядке: сообщения + заметки о смене оператора.
    // Заметка встаёт ПОСЛЕ сообщения-якоря и дальше не двигается —
    // показывается один раз, сколько бы новых сообщений ни пришло.
    const flowItems: FlowItem[] = [];
    for (const note of operatorNotes) {
        if (note.afterMessageId === null) {
            flowItems.push({ kind: 'note', note });
        }
    }
    for (const row of messages ?? []) {
        flowItems.push({ kind: 'message', row });
        for (const note of operatorNotes) {
            if (note.afterMessageId === row.message.id) {
                flowItems.push({ kind: 'note', note });
            }
        }
    }

    return (
        <div className="fixed right-5 bottom-24 z-50 flex h-[520px] w-80 flex-col rounded-2xl bg-card text-[12px] shadow-2xl max-md:inset-x-2 max-md:h-[70vh] max-md:w-auto">
            <div className="flex items-center justify-between">
                <p className="p-4 text-[20px] font-semibold">Поддержка</p>
                <button
                    type="button"
                    aria-label="Закрыть"
                    onClick={onClose}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                    <Close className="h-5 w-5" />
                </button>
            </div>

            {/* Статус беседы: тонкая строка СЛЕВА, без фонового выделения, как у
                мессенджеров. Два состояния: оператор в чате / обращение закрыто.
                «Оператор скоро ответит» тут НЕТ — это разовая подпись в ленте. */}
            {operatorName && !isClosed && (
                <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Оператор: {operatorName}
                </div>
            )}
            {isClosed && (
                <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                    Ваше обращение закрыто
                </div>
            )}

            {/* Пустое состояние: беседы ещё нет — предложение написать первым. */}
            {!myTicket ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                    <Chat className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Напишите нам — оператор ответит в ближайшее время.</p>
                </div>
            ) : (
                /* Блок сообщений: min-h-0 разрешает блоку сжиматься —
                    окно строго фиксированной высоты, сообщения прокручиваются.
                    break-words: длинное слово переносится, не распирая окно. */
                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
                    {flowItems.map((item) => {
                        if (item.kind === 'message') {
                            // mt-2 — отступ между сообщениями (first:mt-0 —
                            // у первого элемента ленты отступа сверху нет).
                            return (
                                <div
                                    key={`msg-${item.row.message.id}`}
                                    className="mt-2 first:mt-0"
                                >
                                    {renderBubble(item.row)}
                                </div>
                            );
                        }
                        return (
                            <p
                                key={`note-${item.note.id}`}
                                // my-2: отступ СВЕРХУ И СНИЗУ — заметка не склеивается
                                // ни с сообщением над ней, ни с именем отправителя
                                // следующего пузыря.
                                className="my-2 flex items-center gap-2 text-xs text-muted-foreground"
                            >
                                <span
                                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                        item.note.kind === 'join' ? 'bg-emerald-500' : 'bg-muted-foreground/60'
                                    }`}
                                />
                                {item.note.text}
                            </p>
                        );
                    })}
                    {/* Разовая подпись «ждём ответа»: видна в конце ленты,
                        пока последнее сообщение моё и оператор не ответил. */}
                    {isWaiting && (
                        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                            Оператор скоро ответит
                        </p>
                    )}
                </div>
            )}
            {/* Поле ввода: растёт до 10 строк, лимит 500 + счётчик —
                внутри ChatTextarea. Enter — отправить. В закрытую заявку
                писать можно: первое же сообщение её переоткроет. */}
            <div className="flex items-end gap-2 border-t p-2">
                <ChatTextarea
                    value={text}
                    onChange={setText}
                    placeholder={isClosed ? 'Написать снова…' : 'Сообщение...'}
                    onSend={handleSend}
                />
                <button
                    type="button"
                    onClick={handleSend}
                    aria-label="Отправить"
                    className="mb-5 shrink-0 cursor-pointer transition-transform hover:scale-110"
                >
                    <Send className="h-7 w-7" />
                </button>
            </div>
        </div>
    );
}
