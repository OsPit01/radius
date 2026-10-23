import { useState } from 'react';

import { Home } from '@/components/icons';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Modal } from '@/components/ui/Modal';
import { displayName, formatChatDate } from '@/lib/chat';
import { type RouterOutputs } from '@/trpc/react';
import { api } from '@/trpc/react';

// Тип элемента — ровно то, что возвращает процедура chat.adminList.
type AdminConversation = RouterOutputs['chat']['adminList'][number];

type ConversationCardProps = {
    item: AdminConversation;
};

/**
 * Карточка беседы в админке: с кем и о какой квартире переписка,
 * сколько сообщений, последняя активность, статус и действия модерации.
 * По кнопке «Открыть переписку» показывает сообщения диалога с возможностью
 * удалить отдельное сообщение или беседу целиком.
 */
export function ConversationCard({ item }: ConversationCardProps) {
    const utils = api.useUtils();
    const isActive = item.conversation.isActive;
    const [open, setOpen] = useState(false);

    const setActive = api.chat.setConversationActive.useMutation({
        onSuccess: () => {
            void utils.chat.adminList.invalidate();
        },
        onError: (error) => {
            alert(error.message);
        },
    });

    const remove = api.chat.deleteConversation.useMutation({
        onSuccess: () => {
            setOpen(false);
            void utils.chat.adminList.invalidate();
        },
        onError: (error) => {
            alert(error.message);
        },
    });

    const removeMessage = api.chat.deleteMessage.useMutation({
        onSuccess: () => {
            void utils.chat.messages.invalidate();
            void utils.chat.adminList.invalidate();
        },
        onError: (error) => {
            alert(error.message);
        },
    });

    // Сообщения диалога (подгружаем только когда модалка открыта).
    const { data: messages } = api.chat.messages.useQuery({ conversationId: item.conversation.id }, { enabled: open });

    const handleDeleteConversation = () => {
        if (window.confirm('Удалить беседу вместе со всеми сообщениями? Действие необратимо.')) {
            remove.mutate({ conversationId: item.conversation.id });
        }
    };

    const senderName = (senderId: string) =>
        senderId === item.conversation.guestId ? displayName(item.guest) : displayName(item.owner);

    return (
        <>
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                {/* Квартира */}
                <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {item.apartment.image ? (
                            <ImageWithFallback
                                src={item.apartment.image}
                                alt={item.apartment.title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <Home className="h-7 w-7 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">
                            {item.apartment.formattedAddress ?? item.apartment.title}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                            {item.messageCount} сообщ. · {item.lastActivity ? formatChatDate(item.lastActivity) : '—'}
                        </p>
                    </div>
                </div>

                {/* Участники */}
                <div className="mt-4 flex flex-col gap-1 text-sm">
                    <p className="truncate text-foreground">
                        <span className="text-muted-foreground">Гость:</span> {displayName(item.guest)}
                    </p>
                    <p className="truncate text-foreground">
                        <span className="text-muted-foreground">Владелец:</span> {displayName(item.owner)}
                    </p>
                </div>

                {/* Статус */}
                <span
                    className={`mt-4 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase ${
                        isActive ? 'bg-[#28a745]' : 'bg-[#dc3545]'
                    }`}
                >
                    {isActive ? 'Активна' : 'Заблокирована'}
                </span>

                {/* Действия */}
                <div className="mt-4 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="w-full cursor-pointer rounded-[30px] bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
                    >
                        Открыть переписку
                    </button>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setActive.mutate({ conversationId: item.conversation.id, isActive: !isActive })
                            }
                            disabled={setActive.isPending}
                            className="flex-1 cursor-pointer rounded-[30px] border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isActive ? 'Заблокировать' : 'Разблокировать'}
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteConversation}
                            disabled={remove.isPending}
                            className="flex-1 cursor-pointer rounded-[30px] border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Удалить
                        </button>
                    </div>
                </div>
            </div>

            {/* Модалка: переписка */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={`${item.apartment.formattedAddress ?? item.apartment.title} — переписка`}
            >
                <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                    {messages?.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">Нет сообщений</p>
                    )}
                    {messages?.map((m) => (
                        <div
                            key={m.id}
                            className="flex items-start justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">
                                        {senderName(m.senderId)}
                                    </span>
                                    <span className="shrink-0 text-[11px] text-muted-foreground">
                                        {formatChatDate(m.createdAt)}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-sm break-words whitespace-pre-line text-foreground">
                                    {m.text}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeMessage.mutate({ messageId: m.id })}
                                disabled={removeMessage.isPending}
                                className="shrink-0 cursor-pointer rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                            >
                                Удалить
                            </button>
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    );
}
