"use client";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { isAdminRole } from "@/lib/constants/roles";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";

import { ModerationCard } from "./ModerationCard";
export default function ModerationPage() {
  const { data } = api.apartment.getForModeration.useQuery();

  const { data: session } = useSession();

  // ===== ПРИОРИТЕТ СТАТУСОВ =====
  const priority: Record<string, number> = {
    moderation: 0, // Сначала на модерации
    active: 1, // Потом активные
    inactive: 2, // Потом неактивные
  };
  // ===== СОРТИРУЕМ ДАННЫЕ (если они есть) =====
  const sortedData = data
    ? [...data].sort((a, b) => {
        const priorityA = priority[a.apartment.status] ?? 999;
        const priorityB = priority[b.apartment.status] ?? 999;
        return priorityA - priorityB;
      })
    : [];

  if (!isAdminRole(session?.user.role)) {
    return (
      <AuthGuard>
        <ClientHeader />
        <div className="p-[60px_20px] text-center text-lg">
          {" "}
          У вас нет доступа{" "}
        </div>
      </AuthGuard>
    );
  }
  return (
    <>
      <AuthGuard>
        <ClientHeader />
        <div className="mx-auto max-w-[1200px] px-4 py-10">
          <h1>Модерация объектов</h1>
          <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
            {sortedData.map((item) => (
              <ModerationCard key={item.apartment.id} item={item} />
            ))}
          </div>
        </div>
      </AuthGuard>
    </>
  );
}
