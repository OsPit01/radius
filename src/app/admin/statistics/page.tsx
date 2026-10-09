"use client";

import { useSession } from "next-auth/react";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { api } from "@/trpc/react";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { isAdminRole } from "@/lib/constants/roles";

// Человекочитаемые подписи статусов.
const APARTMENT_STATUS_LABELS: Record<string, string> = {
  active: "Опубликовано",
  moderation: "На модерации",
  rejected: "Отклонено",
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  new: "Новые",
  approved: "Подтверждены",
  rejected: "Отклонены",
  cancelled: "Отменены",
  expired: "Истекли",
};

// Общая статистика по всему сайту — только для администрации.
// Сама процедура analytics.getSiteStats дополнительно проверяет роль на сервере.
export default function AdminStatisticsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const { data: s } = api.analytics.getSiteStats.useQuery(undefined, {
    enabled: isAdminRole(role),
  });

  if (!isAdminRole(role)) {
    return (
      <AuthGuard>
        <ClientHeader />
        <div className="p-[60px_20px] text-center text-lg">Нет доступа</div>
      </AuthGuard>
    );
  }

  const cards = [
    { value: s?.totalVisits ?? 0, label: "Уникальных переходов" },
    { value: s?.totalUsers ?? 0, label: "Пользователей" },
    { value: s?.totalApartments ?? 0, label: "Квартир" },
    { value: s?.totalBookings ?? 0, label: "Броней" },
    { value: s?.totalViews ?? 0, label: "Просмотров квартир" },
    { value: s?.totalFavorites ?? 0, label: "Добавлений в избранное" },
    {
      value: `${s?.conversionViewToBooking ?? 0}%`,
      label: "Конверсия: просмотр → бронь",
    },
    {
      value: `${s?.conversionViewToFavorite ?? 0}%`,
      label: "Конверсия: просмотр → избранное",
    },
  ];

  return (
    <AuthGuard>
      <ClientHeader />
      <div className="min-h-screen bg-[linear-gradient(135deg,#f5f0f7_0%,#e8e0f0_100%)] px-5 py-10 max-md:px-3 max-md:py-4">
        <div className="mx-auto max-w-[900px] rounded-[24px] bg-[#f6f6fa] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-[480px]:rounded-2xl max-[480px]:p-4 max-md:rounded-[20px] max-md:p-6">
          <h1 className="mb-6 text-[28px] font-bold text-[#1a1a2e] max-md:text-[22px]">
            📊 Общая статистика сайта
          </h1>

          {/* Общие метрики */}
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl bg-white p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(181,82,199,0.1)]"
              >
                <div className="bg-[linear-gradient(135deg,black,#8b3fa0)] bg-clip-text text-2xl leading-[1.2] font-extrabold text-transparent max-md:text-[24px]">
                  {card.value}
                </div>
                <div className="mt-1 text-sm font-medium text-[#555]">
                  {card.label}
                </div>
              </div>
            ))}
          </div>

          {/* Квартиры по статусам */}
          <h2 className="mt-10 mb-4 text-lg font-semibold text-[#1a1a2e]">
            Квартиры по статусам
          </h2>
          <ul className="flex flex-col gap-2">
            {(s?.apartmentsByStatus ?? []).map((row) => (
              <li
                key={row.status}
                className="flex items-center justify-between rounded-[14px] bg-white p-4"
              >
                <span className="font-medium text-[#1a1a2e]">
                  {APARTMENT_STATUS_LABELS[row.status] ?? row.status}
                </span>
                <span className="rounded-full bg-[#f0e6f7] px-3 py-1 text-sm font-semibold text-[#8b3fa0]">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>

          {/* Брони по статусам */}
          <h2 className="mt-10 mb-4 text-lg font-semibold text-[#1a1a2e]">
            Брони по статусам
          </h2>
          <ul className="flex flex-col gap-2">
            {(s?.bookingsByStatus ?? []).map((row) => (
              <li
                key={row.status}
                className="flex items-center justify-between rounded-[14px] bg-white p-4"
              >
                <span className="font-medium text-[#1a1a2e]">
                  {BOOKING_STATUS_LABELS[row.status] ?? row.status}
                </span>
                <span className="rounded-full bg-[#f0e6f7] px-3 py-1 text-sm font-semibold text-[#8b3fa0]">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AuthGuard>
  );
}
