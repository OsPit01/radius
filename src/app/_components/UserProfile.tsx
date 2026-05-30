"use client";

import { useSession, signOut } from "next-auth/react";
import "./UserProfile.css";

export function UserProfile() {
  // Добавь try-catch или проверку на существование хука
  const { data: session, status } = useSession();

  // Статус загрузки
  if (status === "loading") {
    return <div className="loading">Загрузка...</div>;
  }
  // Не авторизован
  if (status === "unauthenticated" || !session) {
    return null;
  }
  // Авторизован - показываем профиль
  const { user } = session;

  return (
    <div className="user-profile">
      <div className="profile-content">
        {user.image && (
          <img
            src={user.image}
            alt={user.name ?? "Аватар"}
            className="avatar"
          />
        )}

        <div className="user-info">
          <div className="user-name">{user.name ?? "Пользователь"}</div>
          <div className="user-email">{user.email ?? "Email не указан"}</div>
          <div className="user-id">ID: {user.id}</div>
        </div>

        <button onClick={() => signOut()} className="logout-btn">
          Выйти
        </button>
      </div>
    </div>
  );
}
