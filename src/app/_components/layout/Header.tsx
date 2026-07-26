"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserDropdown } from "@/app/_components/auth/UserDropdown";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="site-header">
      <div className="header-content">
        <div className="logo">
          <Link href="/">Radius</Link>
        </div>

        <nav className="main-nav">
          <Link href="/apartments">Квартиры</Link>
          <Link href="/cottages">Коттеджи</Link>
          <Link href="/bases">Базы отдыха</Link>
          <Link href="/guest-houses">Гостевые дома</Link>
        </nav>

        <div className="user-actions">
          {!session?.user ? (
            <Link href="/api/auth/signin" className="login-link">
              Войти
            </Link>
          ) : (
            <UserDropdown user={session.user} />
          )}

          <button className="icon-btn">₽</button>
          <button className="icon-btn">РУ</button>
          {session?.user && <button className="icon-btn">❤️</button>}
        </div>
      </div>
    </header>
  );
}
