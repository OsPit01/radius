"use client";
import { api } from "@/trpc/react";
import { AuthGuard } from "../_components/layout/AuthGuard";
import { ClientHeader } from "../_components/layout/ClientHeader";
import { NotificationCard } from "../_components/notifications/NotificationCard";
import { useState } from "react";
import Link from "next/link";
import { Modal } from "../_components/ui/Modal";
import { Bell, CalendarDays, Info, ArrowRight } from "lucide-react";

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
              isRead={item.isRead}
              onClick={() => {
                setSelected(item);
                markAsRead.mutate({ id: item.id });
              }}
            />
          ))}
          {notifications?.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-[#c9b3e1] bg-[#faf7ff] p-10 text-center">
              <Bell className="mx-auto mb-3 h-10 w-10 text-[#c9b3e1]" />
              <p className="font-semibold text-[#6b21a8]">
                Уведомлений пока нет
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Здесь появятся события по вашим объектам
              </p>
            </div>
          )}
        </div>
        {selected && (
          <Modal open onClose={() => setSelected(null)} title="Уведомление">
            <div className="space-y-4">
              {!selected.isRead && (
                <div className="inline-flex items-center gap-2 rounded-full bg-[#6b21a8] px-3 py-1 text-xs font-medium text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  Новое
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#6b21a8]">
                  {selected.type}
                </p>
                <h3 className="mt-1 text-lg font-bold text-[#2d2137]">
                  {selected.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <CalendarDays className="h-4 w-4" />
                {new Date(selected.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <p className="rounded-lg bg-[#faf7ff] p-4 text-sm leading-relaxed text-[#4a4a55]">
                {selected.text}
              </p>
              <p className="flex items-start gap-2 text-xs text-gray-400">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                Нажмите на уведомление, чтобы открыть связанный объект
              </p>
              {selected.link && (
                <Link
                  href={selected.link}
                  onClick={() => setSelected(null)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#6b21a8] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a1478]"
                >
                  Открыть объект
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </Modal>
        )}
      </AuthGuard>
    </>
  );
}
