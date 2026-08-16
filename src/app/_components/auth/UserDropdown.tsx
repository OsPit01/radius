"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/trpc/react";
import { FaUserCircle } from "react-icons/fa";
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
  { href: "/profile", label: "Личный кабинет" },
  { href: "/my-apartments", label: "Мои объекты" },
  { href: "/profile/bookings", label: "Мои бронирования" },
  { href: "/admin/add-apartment", label: "Добавить квартиру" },
  { href: "/profile/settings", label: "Настройки" },
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
  const { data: dbUser } = api.user.getById.useQuery(
    { id: user.id ?? "" },
    { enabled: !!user.id },
  );
  const avatar = dbUser?.image ?? user.image ?? null;
  const displayName =
    dbUser?.firstName || dbUser?.lastName
      ? [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ")
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
            unoptimized
            className="h-[30px] w-[30px] rounded-[50px] object-cover"
          />
        ) : (
          <FaUserCircle className="h-[30px] w-[30px] text-[#666]" />
        )}
        <span className="p-[3px] text-[13px] font-medium">{displayName}</span>
      </button>
      {/*      */}
      {isOpen && (
        <div className="absolute top-[calc(100%+10px)] left-1/2 z-[1000] min-w-[250px] -translate-x-1/2 overflow-hidden rounded-xl border border-[#e0e0e0] bg-white p-[5px] shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-[5px] text-[15px] transition-colors duration-200 hover:w-full hover:rounded-[5px] hover:bg-[#f9f9fd] hover:p-2.5"
            >
              {item.label}
            </Link>
          ))}

          <hr />
          <button
            className="block w-full cursor-pointer p-[5px] text-left text-[15px] transition-colors duration-200 hover:w-full hover:rounded-[5px] hover:bg-[#f9f9fd] hover:p-2.5"
            onClick={() => signOut()}
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
