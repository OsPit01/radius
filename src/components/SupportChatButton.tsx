import { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';

import { ChatTextarea } from '@/components/chat/ChatTextarea';
import { Chat, Send } from '@/components/icons';
import { api } from '@/trpc/react';

export function SupportChatButton() {
    const utils = api.useUtils();
    const { data: session } = useSession();
    const myId = session?.user?.id ?? '';
    const [open, setOpen] = useState(false);
    const [ticketId, setTicketId] = useState<number | null>(null);
    const [text, setText] = useState('');

    // ===== Создание заявки — ЛЕНИВОЕ =====
    // Вызывается ТОЛЬКО при первой отправке сообщения (в handleSend).
    // Раньше заявка создавалась уже при открытии окна — от этого
    // в БД копились ПУСТЫЕ заявки без единого сообщения.
    const openTicket = api.support.openOrGetTicket.useMutation();

    // ===== Моя открытая заявка БЕЗ создания («подглядывание») =====
    // Запрос идёт, только когда окно открыто и ticketId ещё не известен:
    // обращение уже было — подгрузим его историю; не было — ничего не создаём.
    // Возвращает существующий тикет или null (создание — только в handleSend).
    const myOpenTicket = api.support.myOpenTicket.useQuery(undefined, {
        enabled: open && ticketId === null,
    });

    // ===== Сообщения моей заявки (5-секундный опрос, пока окно открыто) =====
    const { data: messages } = api.support.messages.useQuery(
        { id: ticketId ?? 0 },
        { enabled: ticketId !== null, refetchInterval: 5000 },
    );

    // ===== Бейдж непрочитанных ответов поддержки (на КНОПКЕ виджета) =====
    // Опрос раз в 30 сек — тот же ритм, что у бейджа сообщений в шапке.
    const { data: unread } = api.support.unreadCount.useQuery(undefined, {
        enabled: !!session?.user,
        refetchInterval: 30000,
    });

    const sendMessage = api.support.send.useMutation({
        onSuccess: () => void utils.support.messages.invalidate(),
    });

    // Юзер открыл чат = прочитал ответы поддержки: чужие сообщения → isRead.
    // После этого бейдж должен погаснуть → инвалидируем счётчик.
    const markRead = api.support.markRead.useMutation({
        onSuccess: () => void utils.support.unreadCount.invalidate(),
    });

    // Когда моя открытая заявка приезжает с сервера (разговор уже был) —
    // подгружаем её переписку и помечаем ответы поддержки прочитанными.
    // Guard ticketId === null защищает от повторного срабатывания.
    useEffect(() => {
        if (myOpenTicket.data && ticketId === null) {
            setTicketId(myOpenTicket.data.id);
            markRead.mutate({ id: myOpenTicket.data.id });
        }
    }, [myOpenTicket.data, ticketId, markRead]);

    const handleSend = async () => {
        // Guard'ы: пустой текст и «уже отправляем» (двойной Enter/клик).
        if (!text.trim() || sendMessage.isPending) {
            return;
        }
        // Ленивое создание: заявка рождается ТОЛЬКО вместе с первым сообщением.
        let id = ticketId;
        if (id === null) {
            const ticket = await openTicket.mutateAsync();
            if (!ticket) {
                return;
            }
            id = ticket.id;
            setTicketId(id);
        }
        await sendMessage.mutateAsync({ id, text: text.trim() });
        setText('');
    };

    // Открытие окна = просто переключение видимости. Никаких запросов
    // и создания тут: существующая заявка подгрузится сама (myOpenTicket).
    const handleOpen = () => {
        setOpen((v) => !v);
    };

    return (
        <>
            {/* Окно чата — видимо только когда open */}
            {open && (
                <div className="fixed right-5 bottom-24 z-50 flex h-96 w-80 flex-col rounded-2xl bg-card text-[12px] shadow-2xl max-md:inset-x-2 max-md:h-[60vh] max-md:w-auto">
                    <p className="p-4 text-[20px] font-semibold">Поддержка</p>

                    {/* Блок сообщений: min-h-0 разрешает блоку сжиматься —
                        окно строго фиксированной высоты, сообщения прокручиваются.
                        break-words: длинное слово переносится, не распирая окно. */}
                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
                        {messages?.map((m) => (
                            <div
                                key={m.message.id}
                                className={`mb-2 flex ${m.message.senderId === myId ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] min-w-0 rounded-2xl px-3 py-2 break-words ${
                                        m.message.senderId === myId
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-blue-100 text-foreground'
                                    }`}
                                >
                                    {m.message.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Поле ввода: растёт до 10 строк, лимит 500 + счётчик —
                        внутри ChatTextarea. Enter — отправить. */}
                    <div className="flex items-end gap-2 border-t p-2">
                        <ChatTextarea
                            value={text}
                            onChange={setText}
                            placeholder="Сообщение..."
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
                        className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-gray-100 shadow-lg hover:bg-primary/90"
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
