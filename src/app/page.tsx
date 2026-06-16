import Link from "next/link";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import "./page.css";
import { UserProfile } from "@/app/_components/auth/UserProfile";
import { LatestPost } from "@/app/_components/post";
import { SearchForm } from "@/app/_components/search/SearchForm";
import { ApartmentsList } from "@/app/_components/apartments/ApartmentsList";
import { ClientSearchWrapper } from "./_components/ClientSearchWrapper";
import { UserDropdown } from "@/app/_components/auth/UserDropdown";
export default async function Home() {
  const session = await auth();

  if (session?.user) {
  }

  return (
    <HydrateClient>
      {/* ШАПКА */}
      <header className="site-header">
        <div className="header-content">
          <div className="logo">
            <Link href="/">Radius</Link>
          </div>

          <nav className="main-nav">
            <a href="#"></a>
            <a href="#">Коттеджи</a>
            <a href="#">Базы отдыха</a>
            <a href="#">Гостевые дома</a>
          </nav>
          {/* ПРАВАЯ ЧАСТЬ ШАПКИ */}
          <div className="user-actions">
            {!session?.user ? (
              <Link href="/api/auth/signin" className="login-link">
                Войти
              </Link>
            ) : (
              /* <button className="avatar-btn">👤</button> */
              <UserDropdown user={session.user} />
            )}

            <button className="icon-btn">₽</button>
            <button className="icon-btn">РУ</button>
            {session?.user && <button className="icon-btn">❤️</button>}
          </div>
        </div>
      </header>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <main className="main-content">
        {/* вошел */}
        {session?.user ? (
          <>
            <div className="welcome-header">
              <h1 className="welcome-title">Добро пожаловать</h1>
              <p className="welcome-subtitle">Рады видеть вас снова</p>
            </div>
            <ClientSearchWrapper />
          </>
        ) : (
          // не вошел
          <div className="hero-section">
            <h1 className="hero-title">Найдём, где остановиться!</h1>
            <p className="hero-description">Квартиры, отели, гостевые дома</p>
            <ClientSearchWrapper />
          </div>
        )}
      </main>
    </HydrateClient>
  );
}
