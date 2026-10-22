import { useState } from 'react';

import { Chat, Send } from '@/components/icons';
import { api } from '@/trpc/react';
export function SupportChatButton() {
    const [open, setOpen] = useState(false);
    const [ticketId, setTicketId] = useState<number | null>(null);
    const openTicket = api.support.openOrGetTicket.useMutation();
    const sendMessage = api.support.send.useMutation();
    const [text, setText] = useState('');
    const { data: messages } = api.support.messages.useQuery({ id: ticketId ?? 0 }, { enabled: ticketId !== null });

    const handleSend = async () => {
        if (!text.trim()) {
            return;
        }
        // 1. Открываем/берём заявку и ЖДЁМ её id
        const ticket = await openTicket.mutateAsync();
        if (!ticket) {
            return;
        }
        setTicketId(ticket.id);
        // 2. Отправляем сообщение в эту заявку
        await sendMessage.mutateAsync({ id: ticket.id, text: text.trim() });
        setText('');
    };
    return (
        <>
            {/*Заглушка окна - видна только когда open */}
            {open && (
                <div className="fixed right-5 bottom-24 z-50 flex h-96 w-80 flex-col rounded-2xl bg-card shadow-2xl">
                    <p className="p-4 font-semibold">Поддержка</p>

                    <div className="flex-1 overflow-y-auto p-4">
                        {messages?.map((m) => (
                            <div key={m.id}> {m.text}</div>
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
            {/* Кнопка внизу справа */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="fixed right-5 bottom-5 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                aria-label="Поддержка"
            >
                <Chat className="h-7 w-7" />
            </button>
        </>
    );
}
