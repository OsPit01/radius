import { useEffect, useRef } from 'react';

import { MessageBubble } from '@/components/chat/MessageBubble';
import type { RouterOutputs } from '@/trpc/react';

import { SupportChatComposer } from './SupportChatComposer';
import { SupportChatHeader } from './SupportChatHeader';
import type { SupportTicket } from './TicketCard';

type SupportChatProps = {
    selectedId: number;
    selected: SupportTicket | null;
    myId: string;
    messages: RouterOutputs['support']['messages'] | undefined;
    text: string;
    onChangeText: (value: string) => void;
    onBack: () => void;
    onTake: () => void;
    onLeave: () => void;
    onSend: () => void;
    onOpenTransfer: () => void;
    onClose: () => void;
    /** Может ли удалять обращения: только superadmin/mainadmin. */
    canDelete: boolean;
    /** Удалить заявку вместе со ВСЕМИ сообщениями (после подтверждения). */
    onDelete: () => void;
};

/**
 * Окно переписки по одной заявке (админка).
 * Композиция из трёх частей: шапка (SupportChatHeader) + лента сообщений +
 * поле ввода с шаблонами (SupportChatComposer). Здесь — только общие
 * вычисления (закрыта? ведёт другой? можно действовать?) и автопрокрутка.
 */
export function SupportChat({
    selectedId,
    selected,
    myId,
    messages,
    text,
    onChangeText,
    onBack,
    onTake,
    onLeave,
    onSend,
    onOpenTransfer,
    onClose,
    canDelete,
    onDelete,
}: SupportChatProps) {
    // Автопрокрутка вниз: при открытии заявки и при новых сообщениях.
    const messagesRef = useRef<HTMLDivElement>(null);

    // Заявка закрыта: переписка закончена, поле и кнопки действий не нужны.
    const isClosed = selected?.status === 'closed';

    // Заявку ведёт другой админ: смотреть можно, отвечать нельзя.
    const ledByOther = Boolean(selected?.assignedAdmin) && selected?.assignedAdmin?.id !== myId;

    // Действовать может: не закрыта И не ведёт другой админ.
    const canAct = !isClosed && !ledByOther;

    useEffect(() => {
        const el = messagesRef.current;
        if (!el) {
            return;
        }
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [selectedId, messages?.length]);

    return (
        <>
            <SupportChatHeader
                selectedId={selectedId}
                selected={selected}
                myId={myId}
                isClosed={isClosed}
                canAct={canAct}
                canDelete={canDelete}
                onBack={onBack}
                onTake={onTake}
                onLeave={onLeave}
                onClose={onClose}
                onOpenTransfer={onOpenTransfer}
                onDelete={onDelete}
            />

            {/* Переписка выбранной заявки (прокрутка, если сообщений много). */}
            <div
                ref={messagesRef}
                className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-2"
            >
                {messages?.map((m) => (
                    <MessageBubble
                        key={m.message.id}
                        text={m.message.text}
                        isMine={m.message.senderId === myId}
                        sender={m.sender}
                        createdAt={m.message.createdAt}
                    />
                ))}
            </div>

            <SupportChatComposer
                text={text}
                onChangeText={onChangeText}
                onSend={onSend}
                canAct={canAct}
                isClosed={isClosed}
                ledByOther={ledByOther}
                leadName={selected?.assignedAdmin?.firstName ?? selected?.assignedAdmin?.name ?? null}
            />
        </>
    );
}
