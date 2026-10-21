export function NotificationCard({
    title,
    text,
    createdAt,
    isRead,
    onClick,
}: {
    title: string;
    text: string;
    createdAt: Date;
    isRead: boolean;
    onClick: () => void;
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
                {!isRead && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
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
