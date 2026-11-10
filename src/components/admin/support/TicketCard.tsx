import Link from 'next/link';

import { Eye } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { formatChatDate } from '@/lib/chat';
import { getSupportTicketStatusInfo } from '@/lib/constants/support';
import type { RouterOutputs } from '@/trpc/react';

/** Одна заявка из очереди поддержки (тип из процедуры support.listAll). */
export type SupportTicket = RouterOutputs['support']['listAll'][number];

type TicketCardProps = {
    item: SupportTicket;
    /** Развёрнут ли полный id владельца (глаз). */
    expanded: boolean;
    onToggleId: () => void;
    onOpen: () => void;
};

export function TicketCard({ item, expanded, onToggleId, onOpen }: TicketCardProps) {
    // Подпись и цвет бейджа статуса — из единых констант (не хардкод в вёрстке).
    const statusInfo = getSupportTicketStatusInfo(item.status);
    return (
        <div className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary">
            {/* Кликабельная часть: открывает переписку.
                Ссылка на профиль — ОТДЕЛЬНЫМ элементом ниже:
                вкладывать Link внутрь button нельзя (невалидный HTML). */}
            <button
                type="button"
                className="flex w-full cursor-pointer flex-col text-left"
                onClick={onOpen}
            >
                <span className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-semibold">Заявка #{item.id}</span>
                    {item.unreadCount > 0 && (
                        <span className="shrink-0 rounded-full bg-destructive px-2.5 py-0.5 text-sm font-semibold text-destructive-foreground">
                            {item.unreadCount}
                        </span>
                    )}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    {/* Бейдж статуса: «Открыта» (зелёный) / «Закрыта» (серый).
                        `${color}1f` — 8-значный HEX: к цвету добавлена
                        прозрачность 1f (~12%) для фона бейджа. */}
                    <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `${statusInfo.color}1f`, color: statusInfo.color }}
                    >
                        {statusInfo.label}
                    </span>
                    <span>{formatChatDate(item.createdAt)}</span>
                </span>
            </button>

            {/* Владелец обращения: аватар (клик — в карточку пользователя),
                email и скрытый id с глазом. */}
            {item.owner && (
                <div className="mt-3 flex items-center gap-2">
                    <Link
                        href={`/admin/users?query=${item.owner.id}`}
                        aria-label="Открыть профиль пользователя"
                        className="shrink-0 rounded-full transition-opacity hover:opacity-80"
                    >
                        <Avatar
                            src={item.owner.image}
                            name={item.owner.name ?? item.owner.email ?? 'Пользователь'}
                            fallbackText={(item.owner.name ?? item.owner.email ?? 'П').charAt(0).toUpperCase()}
                            size={32}
                        />
                    </Link>
                    <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium break-all text-foreground">{item.owner.email ?? '—'}</span>
                        <span className="flex items-center gap-1">
                            <span
                                className="text-xs text-muted-foreground"
                                title={item.owner.id}
                            >
                                ID: {expanded ? item.owner.id : `${item.owner.id.slice(0, 8)}…`}
                            </span>
                            <button
                                type="button"
                                onClick={onToggleId}
                                aria-label={expanded ? 'Скрыть ID' : 'Показать ID'}
                                className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <Eye className="size-4" />
                            </button>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
