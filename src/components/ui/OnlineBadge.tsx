import { formatLastSeen, isOnline } from '@/lib/presence';

// ============================================================
// OnlineBadge — значок «онлайн / не в сети».
//
// Принимает lastSeenAt (из БД) и сам решает через lib/presence:
// зелёная точка «онлайн» или серая точка + «был(а) X назад».
// Переиспользуемый: админка, чаты, карточки — везде один вид.
// ============================================================
type OnlineBadgeProps = {
    lastSeenAt: Date | null | undefined;
    /** Компактный вид: только точка (для мест, где мало места). */
    dotOnly?: boolean;
};

export function OnlineBadge({ lastSeenAt, dotOnly = false }: OnlineBadgeProps) {
    const online = isOnline(lastSeenAt);

    return (
        <span
            className="inline-flex min-w-0 items-center gap-1.5"
            title={online ? 'Онлайн' : formatLastSeen(lastSeenAt)}
        >
            {/* Точка: зелёная — онлайн, серая — не в сети. */}
            <span
                className={`h-2 w-2 shrink-0 rounded-full ${online ? 'bg-success' : 'bg-muted-foreground/40'}`}
                aria-hidden
            />
            {!dotOnly && (
                <span className="truncate text-xs text-muted-foreground">
                    {online ? 'онлайн' : formatLastSeen(lastSeenAt)}
                </span>
            )}
        </span>
    );
}
