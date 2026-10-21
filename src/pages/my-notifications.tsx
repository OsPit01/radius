import { useState } from 'react';

import { ArrowRight, Bell, CalendarDays, Info } from 'lucide-react';
import Link from 'next/link';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { Modal } from '@/components/ui/Modal';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function MyNotifications() {
    const { data: notifications } = api.notification.getMyNotifications.useQuery();
    const [selected, setSelected] = useState<NonNullable<typeof notifications>[number] | null>(null);
    const utils = api.useUtils();
    const markAllAsRead = api.notification.markAllAsRead.useMutation({
        onSuccess: () => {
            void utils.notification.getMyNotifications.invalidate();
            void utils.notification.getUnreadCount.invalidate();
        },
    });
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
                <div className="mt-auto flex w-full flex-wrap items-center justify-between gap-2 px-5 py-10 max-md:py-5">
                    <span className="text-2xl font-bold text-[#222] max-md:text-xl">Мои уведомления</span>
                    {notifications?.some((n) => !n.isRead) ? (
                        <button
                            type="button"
                            onClick={() => markAllAsRead.mutate()}
                            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-gray-700"
                        >
                            Отметить все
                        </button>
                    ) : null}
                </div>
                <div className="grid grid-cols-1 gap-3 px-5 pb-10 md:grid-cols-2 lg:grid-cols-4">
                    {notifications?.map((item) => (
                        <NotificationCard
                            key={item.id}
                            title={item.title}
                            text={item.text ?? ''}
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
                            <p className="font-semibold text-[#6b21a8]">Уведомлений пока нет</p>
                            <p className="mt-1 text-sm text-gray-500">Здесь появятся события по вашим объектам</p>
                        </div>
                    )}
                </div>
                {selected && (
                    <Modal
                        open
                        onClose={() => setSelected(null)}
                        title="Уведомление"
                    >
                        <div className="space-y-4">
                            {!selected.isRead && (
                                <div className="inline-flex items-center gap-2 rounded-full bg-[#6b21a8] px-3 py-1 text-xs font-medium text-white">
                                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                    Новое
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-medium tracking-wide text-[#6b21a8] uppercase">
                                    {selected.type}
                                </p>
                                <h3 className="mt-1 text-lg font-bold text-[#2d2137]">{selected.title}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <CalendarDays className="h-4 w-4" />
                                {new Date(selected.createdAt).toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
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
                                    className="flex items-center justify-center gap-2 rounded-xl bg-gray-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700"
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
