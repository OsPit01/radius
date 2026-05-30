import Link from "next/link";
import Image from "next/image";
import { LatestPost } from "@/app/_components/post";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import "./page.css"; // ← ЭТА СТРОКА ДОЛЖНА БЫТЬ
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
            /* Если пользователь НЕ ВОШЕЛ */
            <div className="login-box">
              <p className="text-above-login">Вы не авторизованы</p>
              <Link href="/api/auth/signin" className="my-custom-button">
                Войти
              </Link>
            </div>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}
