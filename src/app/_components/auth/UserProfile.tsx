"use client";

import { useSession, signOut } from "next-auth/react";

export function UserProfile() {
  // Добавь try-catch или проверку на существование хука
  const { data: session, status } = useSession();

  // Статус загрузки
  if (status === "loading") {
    return <div className="p-8 text-center text-[#797373]">Загрузка...</div>;
  }
  // Не авторизован
  if (status === "unauthenticated" || !session) {
    return null;
  }
  // Авторизован - показываем профиль
  const { user } = session;

  return (
    <div className="rounded-lg border border-[#e0e0e0] bg-white p-6 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-center gap-4">
        {user.image && (
          <img
            src={user.image}
            alt={user.name ?? "Аватар"}
            className="h-20 w-20 rounded-full object-cover"
          />
        )}

        <div className="flex-1">
          <div className="mb-1 text-xl font-semibold">
            {user.name ?? "Пользователь"}
          </div>
          <div className="mb-1 text-sm text-[#666]">
            {user.email ?? "Email не указан"}
          </div>
          <div className="text-xs text-[#999]">ID: {user.id}</div>
        </div>

        <button
          onClick={() => signOut()}
          className="cursor-pointer rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-[#dc2626]"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
