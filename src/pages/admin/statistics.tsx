import { useSession } from 'next-auth/react';

import { BarChart } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { isAdminRole } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Человекочитаемые подписи статусов.
const APARTMENT_STATUS_LABELS: Record<string, string> = {
    active: 'Опубликовано',
    moderation: 'На модерации',
    rejected: 'Отклонено',
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
    new: 'Новые',
    approved: 'Подтверждены',
    rejected: 'Отклонены',
    cancelled: 'Отменены',
    expired: 'Истекли',
};

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

// Общая статистика по всему сайту — только для администрации.
// Сама процедура analytics.getSiteStats дополнительно проверяет роль на сервере.
export default function AdminStatisticsPage() {
    const { data: session } = useSession();
    const role = session?.user?.role;

    const { data: s } = api.analytics.getSiteStats.useQuery(undefined, {
        enabled: isAdminRole(role),
    });

    if (!isAdminRole(role)) {
        return (
            <AuthGuard>
                <ClientHeader />
                <div className="p-[60px_20px] text-center text-lg">Нет доступа</div>
            </AuthGuard>
        );
    }

    const cards = [
        { value: s?.totalVisits ?? 0, label: 'Уникальных переходов' },
        { value: s?.totalUsers ?? 0, label: 'Пользователей' },
        { value: s?.totalApartments ?? 0, label: 'Квартир' },
        { value: s?.totalBookings ?? 0, label: 'Броней' },
        { value: s?.totalViews ?? 0, label: 'Просмотров квартир' },
        { value: s?.totalFavorites ?? 0, label: 'Добавлений в избранное' },
        {
            value: `${s?.conversionViewToBooking ?? 0}%`,
            label: 'Конверсия: просмотр → бронь',
        },
        {
            value: `${s?.conversionViewToFavorite ?? 0}%`,
            label: 'Конверсия: просмотр → избранное',
        },
    ];

    return (
        <AuthGuard>
            <ClientHeader />
            <div className="min-h-screen bg-background px-5 py-10 max-md:px-3 max-md:py-4">
                <div className="mx-auto max-w-[900px] rounded-[24px] bg-muted p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-[480px]:rounded-2xl max-[480px]:p-4 max-md:rounded-[20px] max-md:p-6">
                    <h1 className="mb-6 flex items-center gap-3 text-[28px] font-bold text-foreground max-md:text-[22px]">
                        <BarChart className="h-9 w-9" />
                        Общая статистика сайта
                    </h1>

                    {/* Общие метрики */}
                    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                        {cards.map((card) => (
                            <div
                                key={card.label}
                                className="rounded-2xl bg-card p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
                            >
                                <div className="bg-[linear-gradient(135deg,var(--foreground),var(--primary))] bg-clip-text text-2xl leading-[1.2] font-extrabold text-transparent max-md:text-[24px]">
                                    {card.value}
                                </div>
                                <div className="mt-1 text-sm font-medium text-muted-foreground">{card.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Квартиры по статусам */}
                    <h2 className="mt-10 mb-4 text-lg font-semibold text-foreground">Квартиры по статусам</h2>
                    <ul className="flex flex-col gap-2">
                        {(s?.apartmentsByStatus ?? []).map((row) => (
                            <li
                                key={row.status}
                                className="flex items-center justify-between rounded-[14px] bg-card p-4"
                            >
                                <span className="font-medium text-foreground">
                                    {APARTMENT_STATUS_LABELS[row.status] ?? row.status}
                                </span>
                                <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-primary">
                                    {row.count}
                                </span>
                            </li>
                        ))}
                    </ul>

                    {/* Брони по статусам */}
                    <h2 className="mt-10 mb-4 text-lg font-semibold text-foreground">Брони по статусам</h2>
                    <ul className="flex flex-col gap-2">
                        {(s?.bookingsByStatus ?? []).map((row) => (
                            <li
                                key={row.status}
                                className="flex items-center justify-between rounded-[14px] bg-card p-4"
                            >
                                <span className="font-medium text-foreground">
                                    {BOOKING_STATUS_LABELS[row.status] ?? row.status}
                                </span>
                                <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-primary">
                                    {row.count}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </AuthGuard>
    );
}
