import { useState } from 'react';

import { useSession } from 'next-auth/react';

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
        // 2. Отправляем сообщение в эту заявку
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
        }
    };

    return (
        <>
            {/*Заглушка окна - видна только когда open */}
            {open && (
                <div className="fixed right-5 bottom-24 z-50 flex h-96 w-80 flex-col rounded-2xl bg-card shadow-2xl max-md:inset-x-2 max-md:h-[60vh] max-md:w-auto">
                    <p className="p-4 font-semibold">Поддержка</p>

                    <div className="flex-1 overflow-y-auto p-4">
                        {messages?.map((m) => (
                            <div
                                key={m.id}
                                className={`mb-2 flex ${m.senderId === myId ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.senderId === myId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                                >
                                    {m.text}{' '}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 border-t p-2">
                        <textarea
                            className="w-full resize-none border-0 bg-transparent outline-none focus:ring-0 focus:outline-none"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Сообщение..."
                        />
                        <button
                            type="button"
                            onClick={handleSend}
                            aria-label="Отправить"
                            className="cursor-pointer transition-transform hover:scale-110"
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
