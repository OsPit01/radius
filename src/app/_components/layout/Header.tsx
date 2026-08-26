"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { UserDropdown } from "@/app/_components/auth/UserDropdown";

const navLinks = [
  // { href: "/apartments", label: "Квартиры" },
  //  { href: "/cottages", label: "Коттеджи" },
  //  { href: "/bases", label: "Базы отдыха" },
  //  { href: "/guest-houses", label: "Гостевые дома" },
] as const;

const mobileLinks = [
  { href: "/profile", label: "Личный кабинет" },
  { href: "/my-apartments", label: "Мои объекты" },
  { href: "/profile/bookings", label: "Мои бронирования" },
  { href: "/admin/add-apartment", label: "Добавить квартиру" },
  { href: "/profile/settings", label: "Настройки" },
] as const;

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-[#eaeaea] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex w-full items-center justify-between gap-10 px-20 py-4 max-lg:px-10 max-md:px-5">
        {/* ЛОГО */}
        <Link
          href="/"
          className="shrink-0 text-2xl font-bold whitespace-nowrap text-[#222] no-underline"
        >
          Radius
        </Link>

        {/* НАВИГАЦИЯ (десктоп)
        <nav className="hidden gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.95rem] font-medium text-[#666] no-underline transition-colors duration-200 hover:text-[#222]"
            >
              {link.label}
            </Link>
          ))}
        </nav> */}

        {/* УПРАВЛЕНИЕ (десктоп) */}
        <div className="hidden shrink-0 items-center gap-4 md:flex">
          {!session?.user ? (
            <Link
              href="/auth/signin"
              className="rounded-[30px] bg-white px-5 py-2 text-[0.85rem] font-medium text-black no-underline transition-colors duration-200 hover:bg-[#f5f5f5]"
            >
              Войти
            </Link>
          ) : (
            <UserDropdown user={session.user} />
          )}

          <button className="cursor-pointer rounded-lg p-2 text-[1.1rem] text-[#666] transition-all duration-200 hover:bg-[#f5f5f5] hover:text-[#222]">
            РУ
          </button>
          {session?.user && (
            <Link
              href="/profile/favorites"
              className="cursor-pointer rounded-lg p-2 text-[1.1rem] no-underline transition-all duration-200 hover:bg-[#f5f5f5]"
            >
              ❤️
            </Link>
          )}
        </div>

        {/* КНОПКА ГАМБУРГЕРА (мобилка) */}
        <button
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-2xl text-[#222] transition-colors hover:bg-[#f5f5f5] md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* МОБИЛЬНОЕ МЕНЮ */}
      {menuOpen && (
        <div className="border-t border-[#eaeaea] md:hidden">
          <nav className="flex flex-col">
            {mobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-[#f5f5f5] px-5 py-4 text-base font-medium text-[#222] no-underline transition-colors hover:bg-[#f9f9fd]"
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
                className="rounded-[30px] bg-[#222] px-6 py-2.5 text-sm font-medium text-white no-underline"
              >
                Войти
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => signOut()}
                className="cursor-pointer rounded-[30px] bg-[#222] px-6 py-2.5 text-sm font-medium text-white"
              >
                Выйти
              </button>
            )}
            <span className="text-sm text-[#666]">РУ</span>
          </div>
        </div>
      )}
    </header>
  );
}
