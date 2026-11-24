import { useSession } from 'next-auth/react';

import { BarChart, Calendar, Eye, Heart } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { requireAuth } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';
import { api } from '@/trpc/react';
import { plural } from '@/utils/plural';

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

// Статистика АРЕНДОДАТЕЛЯ: просмотры моих объектов, брони и избранное.
// Доступна только тем, кто сдаёт жильё (роль не "user").
// (Общая статистика по всему сайту живёт отдельно — в /admin/statistics,
// и видна только администрации.)
export default function StatisticsPage() {
    const { data: session } = useSession();
    const role = session?.user?.role;

    const { data: myStats } = api.analytics.getMyApartmentStats.useQuery(undefined, { enabled: role !== 'user' });

    // Обычному пользователю статистика не нужна — показываем заглушку.
    if (role === 'user') {
        return (
            <AuthGuard>
                <Layout className="max-w-none! p-[60px_20px]! text-center text-lg">
                    Статистика доступна только арендодателям
                </Layout>
            </AuthGuard>
        );
    }

    const cards = [
        [myStats?.totalViews ?? 0, 'Просмотр квартиры', 'Просмотра квартир', 'Просмотров квартир'],
        [myStats?.totalBookings ?? 0, 'Бронирование', 'Бронирования', 'Бронирований'],
        [myStats?.totalFavorites ?? 0, 'Добавление в избранное', 'Добавления в избранное', 'Добавлений в избранное'],
    ] as const;

    const apartments = myStats?.perApartment ?? [];

    return (
        <AuthGuard>
            <Layout className="max-w-none! bg-background px-5! py-10! max-md:px-3! max-md:py-4!">
                <div className="mx-auto max-w-[900px] rounded-[24px] bg-muted p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-[480px]:rounded-2xl max-[480px]:p-4 max-md:rounded-[20px] max-md:p-6">
                    <h1 className="mb-6 flex items-center gap-3 text-3xl font-bold text-foreground max-md:text-2xl">
                        <BarChart className="h-6 w-6" />
                        Статистика моих объектов
                    </h1>

                    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                        {cards.map(([value, one, few, many]) => (
                            <div
                                key={one}
                                className="rounded-2xl bg-card p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
                            >
                                <div className="bg-[linear-gradient(135deg,var(--foreground),var(--primary))] bg-clip-text text-2xl leading-[1.2] font-extrabold text-transparent max-md:text-2xl">
                                    {value}
                                </div>
                                <div className="mt-1 text-sm font-medium text-muted-foreground">
                                    {plural(value, one, few, many)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2 className="mt-10 mb-4 text-lg font-semibold text-foreground">Статистика по каждой квартире</h2>
                    {apartments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            У вас пока нет объектов — добавьте квартиру, чтобы видеть статистику.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {apartments.map((a) => (
                                <li
                                    key={a.apartmentId}
                                    className="flex items-start gap-3 rounded-[14px] bg-card p-4"
                                >
                                    <ImageWithFallback
                                        src={a.cover ?? undefined}
                                        alt={a.title}
                                        width={48}
                                        height={48}
                                        className="size-12 shrink-0 rounded-md object-cover"
                                    />
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        <span className="min-w-0 font-medium break-words text-foreground">
                                            {a.title}
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-semibold text-primary">
                                                <Eye className="h-4 w-4" />
                                                {a.views} {plural(a.views, 'просмотр', 'просмотра', 'просмотров')}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive">
                                                <Heart
                                                    muted
                                                    className="h-4 w-4"
                                                />
                                                {a.favorites} в избранном
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                                                <Calendar className="h-4 w-4" />
                                                {a.bookings}{' '}
                                                {plural(a.bookings, 'бронирование', 'бронирования', 'бронирований')}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Layout>
        </AuthGuard>
    );
}
