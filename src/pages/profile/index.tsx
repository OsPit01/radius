import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { BarChart, Calendar, Chat, Heart, Home, Settings } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { getRoleInfo } from '@/lib/constants/roles';
import { getRoleColor } from '@/lib/theme';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

type UserStats = {
    totalApartments: number;
    totalBookings: number;
    totalFavorites: number;
};
type UserProfile = {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
    role: string;
    emailVerified: Date | null;
};

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function ProfilePage() {
    const { data: session } = useSession();
    const userId = session?.user?.id ?? '';
    // ===== ПОЛУЧАЕМ ПОЛНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ИЗ БД =====

    const { data: userData } = api.user.getById.useQuery(
        {
            id: userId, // ← ID ИЗ СЕССИИ
        },
        {
            enabled: !!userId, // ← ЗАПРАШИВАЕМ ТОЛЬКО ЕСЛИ ЕСТЬ ID
        },
    );

    const { data: statsData } = api.user.getStats.useQuery(
        { userId },
        {
            enabled: !!userId,
        },
    );

    const user: UserProfile = {
        id: userData?.id ?? session?.user.id ?? '',
        name: userData?.name ?? session?.user.name ?? null,
        firstName: userData?.firstName ?? null,
        lastName: userData?.lastName ?? null,
        email: userData?.email ?? session?.user.email ?? '',
        image: userData?.image ?? session?.user.image ?? null,
        role: userData?.role ?? session?.user.role ?? 'user',
        emailVerified: userData?.emailVerified ?? null,
    };
    // ====
    // 3. ДАННЫЕ ИЗ СЕССИИ
    // ====
    const roleInfo = getRoleInfo(user.role);

    // Имя для показа: "Имя Фамилия" из профиля, иначе Google-имя
    const displayName =
        user.firstName || user.lastName
            ? [user.firstName, user.lastName].filter(Boolean).join(' ')
            : (user.name ?? 'Пользователь');

    // ===== СТАТИСТИКА =====
    const stats: UserStats = {
        totalApartments: statsData?.stats?.totalApartments ?? 0,
        totalBookings: statsData?.stats?.totalBookings ?? 0,
        totalFavorites: statsData?.stats?.totalFavorites ?? 0,
    };
    const tiles = [
        { href: '/my-apartments', label: 'Мои объекты', count: stats.totalApartments, Icon: Home },
        { href: '/profile/bookings', label: 'Мои бронирования', count: stats.totalBookings, Icon: Calendar },
        { href: '/profile/favorites', label: 'Избранное', count: stats.totalFavorites, Icon: Heart },
        { href: '/profile/chat', label: 'Мои сообщения', Icon: Chat },
        ...(user.role !== 'user' ? [{ href: '/profile/statistics', label: 'Статистика', Icon: BarChart }] : []),
        { href: '/profile/settings', label: 'Настройки профиля', Icon: Settings },
    ];
    return (
        <>
            <AuthGuard>
                <ClientHeader />
                <div className="min-h-screen bg-background px-5 py-10 max-md:px-3 max-md:py-4">
                    <div className="mx-auto max-w-[900px] rounded-[24px] bg-muted p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-[480px]:rounded-2xl max-[480px]:p-4 max-md:rounded-[20px] max-md:p-6">
                        {/* ====
               1. ШАПКА ПРОФИЛЯ (АВАТАР + ИМЯ + ПОЧТА + РОЛЬ)
               ====*/}
                        <div className="mb-2 flex items-center gap-10 rounded-[20px] border-b-2 border-border bg-card p-7 max-md:flex-col max-md:gap-5 max-md:p-5 max-md:text-center">
                            {/* АВАТАР */}
                            <div className="shrink-0">
                                {user.image ? (
                                    <Image
                                        src={user.image}
                                        alt={user.role || 'User'}
                                        width={50}
                                        height={50}
                                        className="h-20 w-20 rounded-full object-cover shadow-[0_4px_20px_color-mix(in_oklab,var(--primary)_20%,transparent)] max-[480px]:h-20 max-[480px]:w-20 max-md:h-[75px] max-md:w-[75px]"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-foreground bg-foreground text-[48px] font-bold text-background shadow-[0_4px_20px_color-mix(in_oklab,var(--primary)_20%,transparent)] max-[480px]:h-20 max-[480px]:w-20 max-[480px]:text-[32px] max-md:h-[75px] max-md:w-[75px] max-md:text-[40px]">
                                        {displayName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="m-0 text-[32px] font-bold text-foreground max-[480px]:text-[22px] max-md:text-[26px]">
                                    {displayName}
                                </p>
                                <p className="my-1 text-base text-foreground">{user.email}</p>
                                <div className="flex items-center gap-2 max-md:justify-center">
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-[30px] px-[18px] py-1.5 text-[13px] font-semibold tracking-[0.5px] text-white uppercase shadow-[0_4px_12px_rgba(49,53,50,0.658)]"
                                        style={{ background: getRoleColor(user.role) }}
                                    >
                                        {roleInfo.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-4 max-[480px]:grid-cols-1">
                            {tiles.map(({ href, label, count, Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="group flex cursor-pointer flex-col gap-2 rounded-2xl bg-card p-6 text-foreground no-underline transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
                                >
                                    <div className="flex items-center gap-4">
                                        <Icon className="h-8 w-8 shrink-0 text-primary" />
                                        <p className="min-w-0 text-sm font-medium">{label}</p>
                                        {count !== undefined && (
                                            <p className="ml-auto shrink-0 bg-[linear-gradient(135deg,var(--foreground),var(--primary))] bg-clip-text text-lg font-extrabold whitespace-nowrap text-transparent">
                                                {count}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </AuthGuard>
        </>
    );
}
