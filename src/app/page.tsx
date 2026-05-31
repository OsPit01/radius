import Link from "next/link";
import Image from "next/image";
import { LatestPost } from "@/app/_components/post";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import "./page.css";
import { UserProfile } from "@/app/_components/UserProfile";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();
  const posts = await api.post.getAll();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="my-custom-bg">
        <div className="my-block">
          {/* ================= ШАПКА (BAR) ================= */}
          <header className="site-header">
            {/* ================= Логотип ================= */}
            <div className="logo">
              <Link href="/">Radius</Link>
            </div>

            {/* ================= Навигация ================= */}
            <nav className="main-nav">
              <a href="#">Отели</a>
              <a href="#">Коттеджи</a>
              <a href="#">Базы отдыха</a>
              <a href="#">Гостевые дома</a>
            </nav>

            {/* ================= Правое меню ================= */}
            <div className="user-actions">
              <button className="icon-btn" aria-label="выбрать валюту">
                ₽
              </button>
              <button className="icon-btn" aria-label="выбрать язык">
                РУ
              </button>
              {session?.user && (
                <button className="icon-btn" aria-label="Избранное">
                  ❤️
                </button>
              )}

              {/* Кнопка входа в шапке */}
              {!session?.user && (
                <Link href="/api/auth/signin" className="login-link">
                  Войти
                </Link>
              )}
            </div>
          </header>

          {/* Если пользователь ВОШЕЛ */}
          {session?.user ? (
            <>
              {/* Заголовок */}
              <div className="welcome-header">
                <h1 className="welcome-title">Добро пожаловать</h1>
                <p className="welcome-subtitle">Рады видеть вас снова</p>
              </div>

              {/* Профиль пользователя */}
              <UserProfile />

              {/* Посты */}
              <div className="posts">
                {posts.map((post) => (
                  <div key={post.id}>{post.name}</div>
                ))}
              </div>
              <LatestPost />
            </>
          ) : (
            /* Если пользователь НЕ ВОШЕЛ - просто пустой блок с отступом */
            <div className="hero-section">
              <h1 className="hero-title">Найдём, где остановиться!</h1>
              <p className="hero-description">
                Квартиры, отели, гостевые дома — 390 тысяч вариантов для поездок
                по России
              </p>
            </div>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}
