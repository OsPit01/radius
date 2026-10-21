import { useEffect, useRef, useState } from 'react';
import { FaUserCircle } from 'react-icons/fa';

import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

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
    { href: '/profile', label: 'Личный кабинет' },
    { href: '/my-apartments', label: 'Мои объекты' },
    { href: '/profile/bookings', label: 'Мои бронирования' },
    { href: '/profile/chat', label: 'Мои Сообщения' },
    { href: '/admin/add-apartment', label: 'Добавить квартиру' },
    { href: '/profile/settings', label: 'Настройки' },
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
    // Счётчик непрочитанных сообщений (для бейджа у пункта «Сообщения»).
    const { data: unreadCount } = api.chat.unreadCount.useQuery();
    const avatar = dbUser?.image ?? user.image ?? null;
    const displayName =
        dbUser?.firstName || dbUser?.lastName
            ? [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ')
            : (dbUser?.name ?? user.name);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* иконка профиля с функцией dropdown */}
            <button
                className="flex cursor-pointer items-center justify-center p-2 transition-colors duration-200"
                aria-label="Профиль"
            >
                {avatar ? (
                    <Image
                        src={avatar}
                        alt="avatar"
                        width={32}
                        height={32}
                        className="h-[30px] w-[30px] rounded-[50px] object-cover"
                    />
                ) : (
                    <FaUserCircle className="h-[30px] w-[30px] text-muted-foreground" />
                )}
                <span className="p-[3px] text-[13px] font-medium">{displayName}</span>
            </button>
            {/*      */}
            {isOpen && (
                <div className="absolute top-[calc(100%+10px)] left-1/2 z-[1000] min-w-[250px] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card p-[5px] shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[15px] transition-colors duration-200 hover:bg-muted"
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
                        className="block w-full cursor-pointer rounded-lg px-2.5 py-2 text-left text-[15px] transition-colors duration-200 hover:bg-muted"
                        onClick={() => signOut()}
                    >
                        Выйти
                    </button>
                </div>
            )}
        </div>
    );
}
