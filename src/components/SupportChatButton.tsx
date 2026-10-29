import { useState } from 'react';

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
    const openTicket = api.support.openOrGetTicket.useMutation();
    const sendMessage = api.support.send.useMutation({
        onSuccess: () => void utils.support.messages.invalidate(),
    });
    // Открытие окна юзером = он ПРОЧИТАЛ ответы поддержки: помечаем чужие
    // сообщения прочитанными (семантика isRead: для сообщений админа
    // «прочитано юзером»). Без этого ответы поддержки висели непрочитанными вечно.
    const markRead = api.support.markRead.useMutation();
    const [text, setText] = useState('');
    const { data: messages } = api.support.messages.useQuery(
        { id: ticketId ?? 0 },
        { enabled: ticketId !== null, refetchInterval: 5000 },
    );

    const handleSend = async () => {
        if (!text.trim()) {
            return;
        }
        if (ticketId === null) {
            return;
        }
        // Guard от ДВОЙНОЙ отправки: Enter + быстрые клики по кнопке могли
        // отправить сообщение дважды, пока первый запрос летит на сервер.
        if (sendMessage.isPending) {
            return;
        }
        await sendMessage.mutateAsync({ id: ticketId, text: text.trim() });
        setText('');
    };

    // Открытие окна: если тикета ещё нет — открыть/получить его id ОДИН раз
    const handleOpen = async () => {
        setOpen((v) => !v);
        if (ticketId !== null) {
            return;
        } // уже открыт — ничего не делаем
        const ticket = await openTicket.mutateAsync();
        if (ticket) {
            setTicketId(ticket.id);
            // Юзер открыл чат — отмечаем ответы поддержки прочитанными
            markRead.mutate({ id: ticket.id });
        }
    };

    return (
        <>
            {/*Заглушка окна - видна только когда open */}
            {open && (
                <div className="fixed right-5 bottom-24 z-50 flex h-96 w-80 flex-col rounded-2xl bg-card text-[12px] shadow-2xl max-md:inset-x-2 max-md:h-[60vh] max-md:w-auto">
                    <p className="p-4 text-[20px] font-semibold">Поддержка</p>

                    {/* Блок сообщений: min-h-0 — КЛЮЧЕВОЙ класс. По умолчанию
                        flex-элемент отказывается сжиматься ниже размера контента
                        (min-height: auto), и выросшее поле ввода ВЫТАЛКИВАЛО окно.
                        min-h-0 разрешает блоку сжиматься — окно строго h-96 всегда,
                        а сообщения прокручиваются внутри. */}
                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
                        {messages?.map((m) => (
                            <div
                                key={m.id}
                                className={`mb-2 flex ${m.senderId === myId ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    // break-words — КЛЮЧЕВОЙ класс: длинное слово (или строка
                                    // «аааа…» на 500 символов) ПЕРЕНОСИТСЯ по границе пузыря.
                                    // min-w-0 — разрешает flex-элементу сжиматься.
                                    // Без них пузырь распирал окно ВШИРЬ — окно чата
                                    // обязано быть неподвижным, текст растёт ВНИЗ, не В БОК.
                                    // Контраст (чек-лист №9): мои — primary-фон + primary-текст
                                    // (канон MessageBubble). БЫЛО bg-gray-100 + белый текст —
                                    // в светлой теме белый на светло-сером НЕ читался.
                                    className={`max-w-[80%] min-w-0 rounded-2xl px-3 py-2 break-words ${
                                        m.senderId === myId
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-blue-100 text-foreground'
                                    }`}
                                >
                                    {m.text}{' '}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Поле ввода: растёт до 10 строк вместе с текстом (ChatTextarea),
                        лимит 500 и счётчик — внутри компонента. Окно неподвижно:
                        блоку сообщений выше стоит min-h-0, и он уступает место. */}
                    <div className="flex items-end gap-2 border-t p-2">
                        <ChatTextarea
                            value={text}
                            onChange={setText}
                            placeholder="Сообщение..."
                            // Enter — отправить (Shift+Enter — новая строка)
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
            {/* Кнопка внизу справа — ТОЛЬКО для залогиненных: серверные процедуры
                защиты требуют сессию, у гостя клик закончится ошибкой 401.
                Незалогиненным поддержка доступна через «Контакты» и футер. */}
            {session?.user && (
                <button
                    type="button"
                    onClick={handleOpen}
                    className="fixed right-5 bottom-5 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-gray-100 shadow-lg hover:bg-primary/90"
                    aria-label="Поддержка"
                >
                    <Chat className="h-7 w-7" />
                </button>
            )}
        </>
    );
}
