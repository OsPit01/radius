"use client";

// Импортируем хуки из next-auth
import { useSession, signOut } from "next-auth/react";
// Импортируем CSS (обычный, не модуль)
import "./UserProfile.css";

export function UserProfile() {
  // Получаем данные о пользователе
  // session - может быть null если пользователь не авторизован
  // status - статус: "loading", "authenticated", "unauthenticated"
  const { data: session, status } = useSession();

  // 1. Пока грузится - показываем загрузку
  if (status === "loading") {
    return <div className="loading">Загрузка...</div>;
  }

  // 2. Если пользователь НЕ авторизован - показываем кнопку входа
  //    Обрати внимание: здесь НЕ нужен styles., просто строка с названием класса
  if (status === "unauthenticated") {
    return (
      <div className="unauthorized">
        {" "}
        {/* ← исправлено: убрал styles. */}
        <p>Вы не авторизованы!</p>
        <link href="/api/auth/signin" className="discord-login-btn">
          {" "}
          {/* ← исправлено: было discrod (опечатка) */}
          Войти через Discord
        </link>
      </div>
    );
  }

  if (!session) {
    // Если сессии нет - показываем ошибку или редирект
    return <div className="loading">Ошибка загрузки профиля</div>;
  }
  // 3. Если авторизован - показываем профиль
  //    TypeScript теперь знает, что session точно есть, потому что status === "authenticated"
  return (
    <div className="user-profile">
      <div className="profile-content">
        {/* Аватар - проверяем есть ли image */}
        {session.user.image && (
          <img
            src={session.user.image} // ← session.user существует, можем использовать
            alt={session.user.name ?? "Аватар"}
            className="avatar"
          />
        )}

        {/* Информация о пользователе */}
        <div className="user-info">
          <div className="user-name">{session.user.name ?? "Пользователь"}</div>
          <div className="user-email">{session.user.email}</div>
          <div className="user-id">ID: {session.user.id}</div>
        </div>
      </div>

      {/* Кнопка выхода */}
      <button onClick={() => signOut()} className="logout-btn">
        Выйти
      </button>
    </div>
  );
}
