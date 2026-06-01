import Link from "next/link";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import "./page.css";
import { UserProfile } from "@/app/_components/UserProfile";
import { LatestPost } from "@/app/_components/post";
import { SearchForm } from "@/app/_components/SearchForm";
export default async function Home() {
  const session = await auth();
  const posts = await api.post.getAll();

  if (session?.user) {
    void api.post.getLatest.prefetch();
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
            <a href="#">Отели</a>
            <a href="#">Коттеджи</a>
            <a href="#">Базы отдыха</a>
            <a href="#">Гостевые дома</a>
          </nav>

          <div className="user-actions">
            {!session?.user ? (
              <Link href="/api/auth/signin" className="login-link">
                Войти
              </Link>
            ) : (
              <button className="avatar-btn">👤</button>
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
            <UserProfile />
            <div className="posts">
              {posts.map((post) => (
                <div key={post.id}>{post.name}</div>
              ))}
            </div>
            <LatestPost />
          </>
        ) : (
          // не вошел
          <div className="hero-section">
            <h1 className="hero-title">Найдём, где остановиться!</h1>
            <p className="hero-description">Квартиры, отели, гостевые дома</p>
            <SearchForm />
          </div>
        )}
      </main>
    </HydrateClient>
  );
}
