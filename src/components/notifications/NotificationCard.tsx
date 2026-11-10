import { Close } from '@/components/icons';

export function NotificationCard({
    title,
    text,
    createdAt,
    isRead,
    onClick,
    onDelete,
}: {
    title: string;
    text: string;
    createdAt: Date;
    isRead: boolean;
    onClick: () => void;
    /** Если передан — в углу карточки появляется кнопка удаления (X). */
    onDelete?: () => void;
}) {
    return (
        <div
            className={`w-full cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
                isRead
                    ? 'border-border bg-card hover:border-primary/50'
                    : 'border-primary bg-primary/10 hover:border-primary/70'
            }`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2">
                <p className={`line-clamp-1 font-bold ${isRead ? 'text-muted-foreground' : 'text-primary'}`}>{title}</p>
                <div className="flex shrink-0 items-center gap-2">
                    {!isRead && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                    {onDelete && (
                        <button
                            type="button"
                            aria-label="Удалить уведомление"
                            onClick={(e) => {
                                // stopPropagation: клик по X не должен открывать
                                // уведомление (карточка целиком кликабельна).
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Close className="size-4" />
                        </button>
                    )}
                </div>
            </div>
            <p className={`line-clamp-1 truncate ${isRead ? 'text-muted-foreground' : 'text-foreground/80'}`}>{text}</p>
            <p className="line-clamp-1 truncate text-xs text-muted-foreground">
                {createdAt.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                })}
            </p>
        </div>
    );
}
