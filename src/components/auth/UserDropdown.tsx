import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

import { UserCircle } from '@/components/icons';
import { isLessorRole } from '@/lib/constants/roles';
import { HEADER_ICON_BUTTON } from '@/lib/constants/ui';
import { api } from '@/trpc/react';
// Тип для пропсов (данные пользователя)
type UserDropdownProps = {
    user: {
        id?: string | null;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
};

const menuItems = [
    { href: '/profile', label: 'Личный кабинет', lessorOnly: false },
    { href: '/my-apartments', label: 'Мои объекты', lessorOnly: false },
    { href: '/profile/my-bookings', label: 'Мои бронирования', lessorOnly: false },
    // Виден только арендодателю и выше (не обычному пользователю).
    { href: '/profile/manage-bookings', label: 'Управление бронированиями', lessorOnly: true },
    { href: '/profile/chat', label: 'Мои Сообщения', lessorOnly: false },
    { href: '/my-apartments/new', label: 'Добавить квартиру', lessorOnly: false },
    { href: '/profile/settings', label: 'Настройки', lessorOnly: false },
] as const;

export function UserDropdown({ user }: UserDropdownProps) {
    // ===== СОСТОЯНИЯ
    const [isOpen, setIsOpen] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsOpen(true);
    };
    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 300);
    };
    //  Очистка таймера при размонтировании компонента
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Актуальное фото из БД (источник правды) + приоритет показа
    const { data: dbUser } = api.user.getById.useQuery({ id: user.id ?? '' }, { enabled: !!user.id });
    // Счётчик непрочитанных сообщений (бейдж на аватарке и у пункта «Сообщения»).
    // Периодический рефетч держит бейдж свежим, даже если сообщение пришло, пока мы на другой странице.
    const { data: unreadCount } = api.chat.unreadCount.useQuery(undefined, { refetchInterval: 30000 });
    // «Управление бронированиями» видно арендодателю и выше (isLessorRole — по уровню, мусор отсекается).
    const canManage = isLessorRole(dbUser?.role);
    const avatar = dbUser?.image ?? user.image ?? null;
    const displayName =
        dbUser?.firstName || dbUser?.lastName
            ? [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ')
            : (dbUser?.name ?? user.name);

    return (
        <div
            className="relative inline-flex items-center gap-2"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* иконка профиля с функцией dropdown.
                Бейдж непрочитанных сообщений лежит СНАРУЖИ кнопки (у неё overflow-hidden —
                внутри он бы обрезался) в отдельном relative-контейнере. */}
            <div className="relative shrink-0">
                <button
                    className={`overflow-hidden rounded-full ${HEADER_ICON_BUTTON}`}
                    aria-label="Профиль"
                >
                    {avatar ? (
                        <Image
                            src={avatar}
                            alt="avatar"
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <UserCircle className="h-10 w-10 text-muted-foreground" />
                    )}
                </button>
                {(unreadCount ?? 0) > 0 && (
                    <span className="absolute right-0 bottom-0 flex h-3 min-w-3 items-center justify-center rounded-full bg-destructive px-1 text-xs leading-none font-semibold text-destructive-foreground ring-1 ring-background">
                        {unreadCount}
                    </span>
                )}
            </div>
            <span className="text-xs font-medium">{displayName}</span>
            {/*      */}
            {isOpen && (
                <div className="absolute top-[calc(100%+10px)] left-1/2 z-[1000] min-w-[250px] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card p-[5px] shadow-[0_10px_30px_rgba(0,0,0,0.15)] max-md:right-0 max-md:left-auto max-md:translate-x-0">
                    {menuItems
                        .filter((item) => !item.lessorOnly || canManage)
                        .map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-base transition-colors duration-200 hover:bg-muted"
                            >
                                <span>{item.label}</span>
                                {item.href === '/profile/chat' && (unreadCount ?? 0) > 0 && (
                                    <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        ))}

                    <hr className="my-1" />
                    <button
                        className="block w-full cursor-pointer rounded-lg px-2.5 py-2 text-left text-base transition-colors duration-200 hover:bg-muted"
                        onClick={() => signOut()}
                    >
                        Выйти
                    </button>
                </div>
            )}
        </div>
    );
}
