import { Bell } from 'lucide-react';

import { api } from '@/trpc/react';

export function NotificationBell() {
    const { data: unreadCount } = api.notification.getUnreadCount.useQuery();

    return (
        <div className="flex items-center gap-1">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {(unreadCount ?? 0) > 0 && (
                <span className="rounded-full bg-warning px-1.5 text-xs text-warning-foreground">{unreadCount}</span>
            )}
        </div>
    );
}
