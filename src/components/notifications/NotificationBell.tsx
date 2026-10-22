import { Bell } from '@/components/icons';
import { api } from '@/trpc/react';

/** Колокольчик с бейджем непрочитанных. Бейдж — в углу, поэтому размер кнопки в шапке не «плывёт». */
export function NotificationBell() {
    const { data: unreadCount } = api.notification.getUnreadCount.useQuery();

    return (
        <>
            <Bell className="h-6 w-6 text-muted-foreground" />
            {(unreadCount ?? 0) > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] rounded-full bg-warning px-1 text-center text-[11px] leading-[18px] text-warning-foreground">
                    {unreadCount}
                </span>
            )}
        </>
    );
}
