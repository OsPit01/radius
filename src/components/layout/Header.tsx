import { useEffect, useState } from 'react';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

import { UserDropdown } from '@/components/auth/UserDropdown';
import { Close, Heart, Menu } from '@/components/icons';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { HEADER_ICON_BUTTON } from '@/lib/constants/ui';
import { api } from '@/trpc/react';

const mobileLinks = [
    { href: '/profile', label: 'Личный кабинет' },
    { href: '/my-apartments', label: 'Мои объекты' },
    { href: '/profile/bookings', label: 'Мои бронирования' },
    { href: '/profile/chat', label: 'Сообщения' },
    { href: '/admin/add-object', label: 'Добавить квартиру' },
    { href: '/profile/settings', label: 'Настройки' },
] as const;

/** true, как только страницу прокрутили хотя бы на пиксель (в духе шапки Vercel). */
function useScrolled() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const update = () => setScrolled(window.scrollY > 0);
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);

    return scrolled;
}

/** Сердце «Избранное»: тот же значок, что на карточке, размером и цветом как колокольчик. */
function FavoritesIcon() {
    return (
        <Heart
            muted
            className="h-6 w-6 text-muted-foreground transition-colors duration-200 group-hover:text-primary/60"
        />
    );
}

export function Header() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const scrolled = useScrolled();
    // Непрочитанные сообщения — для бейджа у пункта «Сообщения» в мобильном меню
    // (на десктопе этот же счётчик показывает UserDropdown на аватарке).
    const { data: chatUnread } = api.chat.unreadCount.useQuery(undefined, {
        enabled: !!session?.user,
        refetchInterval: 30000,
    });

    return (
        <header
            // Цвет как у страницы; граница в 1px появляется только при прокрутке.
            className={`sticky top-0 z-[100] w-full border-b bg-background transition-colors duration-200 ${
                scrolled || menuOpen ? 'border-foreground/15' : 'border-transparent'
            }`}
        >
            <div className="mx-auto flex w-full items-center justify-between gap-10 px-20 py-4 max-lg:px-10 max-md:gap-2 max-md:px-5">
                {/* ЛОГО */}
                <Link
                    href="/"
                    className="shrink-0 text-2xl font-bold whitespace-nowrap text-foreground no-underline"
                >
                    NaRadare
                </Link>

                {/* УПРАВЛЕНИЕ (десктоп) */}
                <div className="hidden shrink-0 items-center gap-4 md:flex">
                    {!session?.user ? (
                        <Link
                            href="/auth/signin"
                            className="rounded-[30px] px-5 py-2 text-[0.85rem] font-medium text-foreground no-underline transition-colors duration-200 hover:bg-muted"
                        >
                            Войти
                        </Link>
                    ) : (
                        <UserDropdown user={session.user} />
                    )}
                    {/* иконка сердца */}
                    {session?.user && (
                        <div className="relative flex flex-1 items-center gap-1">
                            <Link
                                href="/profile/favorites"
                                className={`group rounded-lg ${HEADER_ICON_BUTTON}`}
                                aria-label="Избранное"
                            >
                                <FavoritesIcon />
                            </Link>
                            {/* иконка колокольчик */}
                            <Link
                                href="/my-notifications"
                                className={`rounded-lg ${HEADER_ICON_BUTTON}`}
                                aria-label="Уведомления"
                            >
                                <NotificationBell />
                            </Link>
                        </div>
                    )}
                </div>

                {/* УПРАВЛЕНИЕ (мобилка): избранное + уведомления + гамбургер */}
                <div className="flex shrink-0 items-center gap-1 md:hidden">
                    {session?.user && (
                        <>
                            <Link
                                href="/profile/favorites"
                                className={`group rounded-lg ${HEADER_ICON_BUTTON}`}
                                aria-label="Избранное"
                            >
                                <FavoritesIcon />
                            </Link>
                            <Link
                                href="/my-notifications"
                                className={`rounded-lg ${HEADER_ICON_BUTTON}`}
                                aria-label="Уведомления"
                            >
                                <NotificationBell />
                            </Link>
                        </>
                    )}
                    <button
                        className={`rounded-lg text-foreground ${HEADER_ICON_BUTTON}`}
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? <Close className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* МОБИЛЬНОЕ МЕНЮ */}
            {menuOpen && (
                <div className="border-t border-border md:hidden">
                    <nav className="flex flex-col">
                        {mobileLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-between border-b border-border px-5 py-4 text-base font-medium text-foreground no-underline transition-colors hover:bg-muted"
                            >
                                {link.label}
                                {link.href === '/profile/chat' && (chatUnread ?? 0) > 0 && (
                                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs leading-none font-semibold text-destructive-foreground">
                                        {chatUnread}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>
                    <div className="flex items-center justify-between px-5 py-4">
                        {!session?.user ? (
                            <Link
                                href="/auth/signin"
                                onClick={() => setMenuOpen(false)}
                                className="rounded-[30px] bg-foreground px-6 py-2.5 text-sm font-medium text-background no-underline"
                            >
                                Войти
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => signOut()}
                                className="cursor-pointer rounded-[30px] bg-foreground px-6 py-2.5 text-sm font-medium text-background"
                            >
                                Выйти
                            </button>
                        )}
                        <span className="text-sm text-muted-foreground">РУ</span>
                    </div>
                </div>
            )}
        </header>
    );
}
