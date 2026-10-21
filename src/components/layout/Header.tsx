import { useEffect, useState } from 'react';
import { FaRegHeart } from 'react-icons/fa';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

import { UserDropdown } from '@/components/auth/UserDropdown';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const mobileLinks = [
    { href: '/profile', label: 'Личный кабинет' },
    { href: '/my-apartments', label: 'Мои объекты' },
    { href: '/profile/bookings', label: 'Мои бронирования' },
    { href: '/profile/chat', label: 'Сообщения' },
    { href: '/admin/add-apartment', label: 'Добавить квартиру' },
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
        <FaRegHeart className="h-5 w-5 text-muted-foreground transition-colors duration-200 group-hover:text-primary/60" />
    );
}

export function Header() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const scrolled = useScrolled();

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
                    Radius
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
                        <div className="relative flex flex-1">
                            <Link
                                href="/profile/favorites"
                                className="group cursor-pointer rounded-lg p-2 text-[1.1rem] no-underline transition-all duration-200 hover:bg-muted"
                                aria-label="Избранное"
                            >
                                <FavoritesIcon />
                            </Link>
                            {/* иконка колокольчик */}
                            <Link
                                href="/my-notifications"
                                className="cursor-pointer rounded-lg p-2 text-[1.1rem] no-underline transition-all duration-200 hover:bg-muted"
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
                                className="group cursor-pointer rounded-lg p-2 text-[1.1rem] no-underline transition-colors hover:bg-muted"
                                aria-label="Избранное"
                            >
                                <FavoritesIcon />
                            </Link>
                            <Link
                                href="/my-notifications"
                                className="cursor-pointer rounded-lg p-2 no-underline transition-colors hover:bg-muted"
                                aria-label="Уведомления"
                            >
                                <NotificationBell />
                            </Link>
                        </>
                    )}
                    <button
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-2xl text-foreground transition-colors hover:bg-muted"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? '✕' : '☰'}
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
                                className="border-b border-border px-5 py-4 text-base font-medium text-foreground no-underline transition-colors hover:bg-muted"
                            >
                                {link.label}
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
