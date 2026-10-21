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
                    ? 'border-[#eee5f4] bg-white hover:border-[#c9b3e1]'
                    : 'border-[#6b21a8] bg-[#f7f3ff] hover:border-[#4a1478]'
            }`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2">
                <p className={`line-clamp-1 font-bold ${isRead ? 'text-gray-500' : 'text-[#4a1478]'}`}>{title}</p>
                {!isRead && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#6b21a8]" />}
            </div>
            <p className={`line-clamp-1 truncate ${isRead ? 'text-gray-400' : 'text-gray-600'}`}>{text}</p>
            <p className="line-clamp-1 truncate text-xs text-gray-400">
                {createdAt.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                })}
            </p>
        </div>
    );
}
