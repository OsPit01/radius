"use client";
import { api } from "@/trpc/react";
import { AuthGuard } from "../_components/layout/AuthGuard";
import { ClientHeader } from "../_components/layout/ClientHeader";
import { NotificationCard } from "../_components/notifications/NotificationCard";
import { useState } from "react";
import { Modal } from "../_components/ui/Modal";

export default function MyNotifications() {
  const { data: notifications } =
    api.notification.getMyNotifications.useQuery();
  const [selected, setSelected] = useState<
    NonNullable<typeof notifications>[number] | null
  >(null);
  const utils = api.useUtils();
  const markAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.getMyNotifications.invalidate();
      void utils.notification.getUnreadCount.invalidate();
    },
  });
  return (
    <>
      <AuthGuard>
        <ClientHeader />
        <div className="mt-auto w-full px-5 py-10">
          <span className="text-[30px]">Мои уведомления</span>
        </div>
        <div className="grid grid-cols-1 gap-3 px-5 pb-10 md:grid-cols-2 lg:grid-cols-4">
          {notifications?.map((item) => (
            <NotificationCard
              key={item.id}
              title={item.title}
              text={item.text ?? ""}
              createdAt={new Date(item.createdAt)}
              onClick={() => {
                setSelected(item);
                markAsRead.mutate({ id: item.id });
              }}
            />
          ))}
        </div>
        {selected && (
          <Modal open onClose={() => setSelected(null)} title={selected.title}>
            <p className="text-sm text-[#555]">{selected.text}</p>
            <p className="mt-3 text-xs text-gray-400">
              {new Date(selected.createdAt).toLocaleDateString("ru-RU")}
            </p>
          </Modal>
        )}
      </AuthGuard>
    </>
  );
}
