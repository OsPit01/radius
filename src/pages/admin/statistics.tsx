import { useSession } from 'next-auth/react';

import { BarChart } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { BOOKING_STATUS_PLURAL_LABELS as BOOKING_STATUS_LABELS } from '@/lib/constants/booking';
import { isAdminRole } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';
import { api } from '@/trpc/react';
import { plural } from '@/utils/plural';
// Человекочитаемые подписи статусов.
const APARTMENT_STATUS_LABELS: Record<string, string> = {
    active: 'Опубликовано',
    moderation: 'На модерации',
    rejected: 'Отклонено',
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
                <Layout className="max-w-none! p-[60px_20px]! text-center text-lg">Нет доступа</Layout>
            </AuthGuard>
        );
    }

    const countCards = [
        [s?.totalVisits ?? 0, 'Уникальный переход', 'Уникальных перехода', 'Уникальных переходов'],
        [s?.totalUsers ?? 0, 'Пользователь', 'Пользователя', 'Пользователей'],
        [s?.totalApartments ?? 0, 'Квартира', 'Квартиры', 'Квартир'],
        [s?.totalBookings ?? 0, 'Бронирование', 'Бронирования', 'Бронирований'],
        [s?.totalViews ?? 0, 'Просмотр квартиры', 'Просмотра квартир', 'Просмотров квартир'],
        [s?.totalFavorites ?? 0, 'Добавление в избранное', 'Добавления в избранное', 'Добавлений в избранное'],
    ] as const;
    const cards = [
        ...countCards.map(([value, one, few, many]) => ({ key: one, value, label: plural(value, one, few, many) })),
        {
            key: 'view-to-booking',
            value: `${s?.conversionViewToBooking ?? 0}%`,
            label: 'Конверсия: просмотр → бронь',
        },
        {
            key: 'view-to-favorite',
            value: `${s?.conversionViewToFavorite ?? 0}%`,
            label: 'Конверсия: просмотр → избранное',
        },
    ];

    return (
        <AuthGuard>
            <Layout>
                <div className="mx-auto max-w-[900px] rounded-[24px] bg-muted p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-[480px]:rounded-2xl max-[480px]:p-4 max-md:rounded-[20px] max-md:p-6">
                    <h1 className="mb-6 flex items-center gap-3 text-[28px] font-bold text-foreground max-md:text-[22px]">
                        <BarChart className="h-6 w-6" />
                        Общая статистика сайта
                    </h1>

                    {/* Общие метрики */}
                    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                        {cards.map((card) => (
                            <div
                                key={card.key}
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
            </Layout>
        </AuthGuard>
    );
}
