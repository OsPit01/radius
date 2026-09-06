"use client";

import { api } from "@/trpc/react";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const { data: unreadCount } = api.notification.getUnreadCount.useQuery();
  const utils = api.useUtils();
  const markAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.getMyNotifications.invalidate();
      void utils.notification.getUnreadCount.invalidate();
    },
  });
  return (
    <div className="flex items-center gap-1">
      <Bell className="h-5 w-5 text-gray-600" />
      {(unreadCount ?? 0) > 0 && (
        <span className="rounded-full bg-yellow-500 px-1.5 text-xs text-white">
          {unreadCount}
        </span>
      )}
    </div>
  );
}
