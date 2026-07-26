"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import "./UserDropdown.css";
import Image from "next/image";
// Тип для пропсов (данные пользователя)
type UserDropdownProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

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

  return (
    <div
      className="user-dropdown"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* иконка профиля с функцией dropdown */}
      <button className="avatar-btn" aria-label="Профиль">
        {user.image ? (
          <Image
            src={user.image}
            alt="avatar"
            width={32}
            height={32}
            className="avatar-image"
          />
        ) : (
          <span className="avatar-emoji">👤 </span>
        )}
        <span className="avatar-name"> {user.name}</span>
      </button>
      {/*      */}
      {isOpen && (
        <div className="dropdown-menu">
          <Link href="/PersonalAccount" className="dropdown-item">
            Личный кабинет
          </Link>
          {/* !!!!! ДОБАВЛЕН ПУНКТ "МОИ ОБЪЕКТЫ" !!!!! */}
          <Link href="/my-apartments" className="dropdown-item">
            Мои объекты
          </Link>
          <Link href="/bookings" className="dropdown-item">
            Мои бронирования
          </Link>
          <Link href="/admin/add-apartment" className="dropdown-item">
            добавить квартиру
          </Link>
          <Link href="/settings" className="dropdown-item">
            Настройки
          </Link>

          <hr />
          <button className="logout-btn" onClick={() => signOut}>
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
