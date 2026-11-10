import { useEffect, useRef, useState } from 'react';

import { useSession } from 'next-auth/react';

import { ChatTextarea } from '@/components/chat/ChatTextarea';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Chat, Close, Send } from '@/components/icons';
import { api } from '@/trpc/react';

export function SupportChatButton() {
    const utils = api.useUtils();
    const { data: session } = useSession();
    const myId = session?.user?.id ?? '';
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');

    // ===== Создание заявки — ЛЕНИВОЕ =====
    // Вызывается ТОЛЬКО при первой отправке сообщения (в handleSend),
    // когда у пользователя ещё НЕТ ни одной заявки.
    const openTicket = api.support.openOrGetTicket.useMutation();

    // ===== Моя беседа («подглядывание», БЕЗ создания) =====
    // ОДИН ИСТОЧНИК ПРАВДЫ для всего виджета: последняя заявка юзера
    // (любого статуса) + её статус + кто из админов ведёт.
    // Опрос каждые 5 сек, пока окно открыто: админ взял заявку или
    // закрыл её — виджет сам подтянет и обновит подпись сверху.
    const { data: myTicket } = api.support.myTicket.useQuery(undefined, {
        enabled: open,
        refetchInterval: 5000,
    });

    // ===== Сообщения моей беседы (5-секундный опрос, пока есть заявка) =====
    // enabled по id, а НЕ по myTicket !== null: myTicket бывает ещё и undefined
    // (запрос не отработал или отключён, пока виджет закрыт), и тогда
    // запрос летел бы с id:0 → «Заявка не найдена» каждые 5 секунд.
    const { data: messages } = api.support.messages.useQuery(
        { id: myTicket?.id ?? 0 },
        { enabled: myTicket?.id !== undefined, refetchInterval: 5000 },
    );

    // ===== Бейдж непрочитанных ответов поддержки (на КНОПКЕ виджета) =====
    // Опрос раз в 30 сек — тот же ритм, что у бейджа сообщений в шапке.
    const { data: unread } = api.support.unreadCount.useQuery(undefined, {
        enabled: !!session?.user,
        refetchInterval: 30000,
    });

    const sendMessage = api.support.send.useMutation({
        onSuccess: () => {
            void utils.support.messages.invalidate();
            // Написали в закрытую заявку → сервер её переоткрыл:
            // подтягиваем свежий статус, чтобы подпись сверху обновилась сразу.
            void utils.support.myTicket.invalidate();
        },
    });

    // Юзер открыл беседу = прочитал ответы поддержки: чужие сообщения → isRead.
    // После этого бейдж должен погаснуть → инвалидируем счётчик.
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

    // Открытие окна = просто переключение видимости. Никаких запросов
    // и создания тут: существующая заявка подгрузится сама (myTicket).
    const handleOpen = () => {
        setOpen((v) => !v);
    };

    // Подпись статуса в шапке окна (мелкий серый текст, как у чатов поддержки):
    // админ ведёт → «Оператор: Имя» (нет имени — email);
    // никто не ведёт → «Оператор скоро ответит»;
    // заявка закрыта → «Ваше обращение закрыто».
    const operatorName = myTicket?.assignedAdmin?.name ?? myTicket?.assignedAdmin?.email ?? null;
    const isClosed = myTicket?.status === 'closed';

    return (
        <>
            {/* Окно чата — видимо только когда open */}
            {open && (
                <div className="fixed right-5 bottom-24 z-50 flex h-96 w-80 flex-col rounded-2xl bg-card text-[12px] shadow-2xl max-md:inset-x-2 max-md:h-[60vh] max-md:w-auto">
                    <div className="flex items-center justify-between">
                        <p className="p-4 text-[20px] font-semibold">Поддержка</p>
                        <button
                            type="button"
                            aria-label="Закрыть"
                            onClick={() => setOpen(false)}
                            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Close className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Статус беседы: мелкий серый текст по центру, как у чатов
                        поддержки. Меняется сам: ждём оператора → оператор назначен
                        → обращение закрыто. */}
                    {myTicket && (
                        <p className="border-b border-border bg-muted/40 px-4 py-1.5 text-center text-xs text-muted-foreground">
                            {isClosed
                                ? 'Ваше обращение закрыто'
                                : operatorName
                                  ? `Оператор: ${operatorName}`
                                  : 'Оператор скоро ответит'}
                        </p>
                    )}

                    {/* Пустое состояние: беседы ещё нет — предложение написать первым. */}
                    {!myTicket ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                            <Chat className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Напишите нам — оператор ответит в ближайшее время.
                            </p>
                        </div>
                    ) : (
                        /* Блок сообщений: min-h-0 разрешает блоку сжиматься —
                            окно строго фиксированной высоты, сообщения прокручиваются.
                            break-words: длинное слово переносится, не распирая окно. */
                        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
                            {messages?.map((m) => (
                                <MessageBubble
                                    key={m.message.id}
                                    text={m.message.text}
                                    isMine={m.message.senderId === myId}
                                    sender={m.sender}
                                    createdAt={m.message.createdAt}
                                    compact
                                />
                            ))}
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
            )}
            {/* Кнопка внизу справа — ТОЛЬКО для залогиненных (процедуры требуют
                сессию). Обёртка держит кнопку и бейдж непрочитанных ответов. */}
            {session?.user && (
                <div className="fixed right-5 bottom-5 z-50">
                    <button
                        type="button"
                        onClick={handleOpen}
                        className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                        aria-label="Поддержка"
                    >
                        <Chat className="h-7 w-7" />
                    </button>
                    {/* Бейдж: сколько ответов поддержки я ещё не прочитал.
                        Появляется только при непрочитанных (> 0), как бейдж
                        сообщений в шапке; ring-2 — отрыв от фона. */}
                    {(unread ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs leading-none font-semibold text-destructive-foreground ring-2 ring-background">
                            {unread}
                        </span>
                    )}
                </div>
            )}
        </>
    );
}
