"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserDropdown } from "@/app/_components/auth/UserDropdown";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-[#eaeaea] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex w-full items-center justify-between gap-10 px-20 py-4 max-lg:px-10 max-md:flex-col max-md:gap-4 max-md:px-5">
        <div className="shrink-0">
          <Link
            href="/"
            className="whitespace-nowrap text-2xl font-bold text-[#222] no-underline"
          >
            Radius
          </Link>
        </div>

        <nav className="flex gap-8 max-md:flex-wrap max-md:justify-center max-md:gap-5">
          <Link
            href="/apartments"
            className="text-[0.95rem] font-medium text-[#666] no-underline transition-colors duration-200 hover:text-[#222]"
          >
            Квартиры
          </Link>
          <Link
            href="/cottages"
            className="text-[0.95rem] font-medium text-[#666] no-underline transition-colors duration-200 hover:text-[#222]"
          >
            Коттеджи
          </Link>
          <Link
            href="/bases"
            className="text-[0.95rem] font-medium text-[#666] no-underline transition-colors duration-200 hover:text-[#222]"
          >
            Базы отдыха
          </Link>
          <Link
            href="/guest-houses"
            className="text-[0.95rem] font-medium text-[#666] no-underline transition-colors duration-200 hover:text-[#222]"
          >
            Гостевые дома
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-4 max-md:flex-wrap max-md:justify-center">
          {!session?.user ? (
            <Link
              href="/api/auth/signin"
              className="rounded-[30px] bg-white px-5 py-2 text-[0.85rem] font-medium text-black no-underline transition-colors duration-200 hover:bg-[#f5f5f5]"
            >
              Войти
            </Link>
          ) : (
            <UserDropdown user={session.user} />
          )}

          <button className="cursor-pointer rounded-lg p-2 text-[1.1rem] text-[#666] transition-all duration-200 hover:bg-[#f5f5f5] hover:text-[#222]">
            ₽
          </button>
          <button className="cursor-pointer rounded-lg p-2 text-[1.1rem] text-[#666] transition-all duration-200 hover:bg-[#f5f5f5] hover:text-[#222]">
            РУ
          </button>
          {session?.user && (
            <button className="cursor-pointer rounded-lg p-2 text-[1.1rem] text-[#666] transition-all duration-200 hover:bg-[#f5f5f5] hover:text-[#222]">
              ❤️
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
