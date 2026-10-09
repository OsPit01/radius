"use client";

import { useSession } from "next-auth/react";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { api } from "@/trpc/react";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";

// Статистика АРЕНДОДАТЕЛЯ: просмотры моих объектов, брони и избранное.
// Доступна только тем, кто сдаёт жильё (роль не "user").
// (Общая статистика по всему сайту живёт отдельно — в /admin/statistics,
// и видна только администрации.)
export default function StatisticsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const { data: myStats } = api.analytics.getMyApartmentStats.useQuery(
    undefined,
    { enabled: role !== "user" },
  );

  // Обычному пользователю статистика не нужна — показываем заглушку.
  if (role === "user") {
    return (
      <AuthGuard>
        <ClientHeader />
        <div className="p-[60px_20px] text-center text-lg">
          Статистика доступна только арендодателям
        </div>
      </AuthGuard>
    );
  }

  const cards = [
    { value: myStats?.totalViews ?? 0, label: "Просмотров квартир" },
    { value: myStats?.totalBookings ?? 0, label: "Бронирований" },
    { value: myStats?.totalFavorites ?? 0, label: "Добавлений в избранное" },
  ];

  const apartments = myStats?.perApartment ?? [];

  return (
    <>
      <AuthGuard>
        <ClientHeader />
        <div className="min-h-screen bg-[linear-gradient(135deg,#f5f0f7_0%,#e8e0f0_100%)] px-5 py-10 max-md:px-3 max-md:py-4">
          <div className="mx-auto max-w-[900px] rounded-[24px] bg-[#f6f6fa] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-[480px]:rounded-2xl max-[480px]:p-4 max-md:rounded-[20px] max-md:p-6">
            <h1 className="mb-6 text-[28px] font-bold text-[#1a1a2e] max-md:text-[22px]">
              📊 Статистика моих объектов
            </h1>

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

            <h2 className="mt-10 mb-4 text-lg font-semibold text-[#1a1a2e]">
              Статистика по каждой квартире
            </h2>
            {apartments.length === 0 ? (
              <p className="text-sm text-[#777]">
                У вас пока нет объектов — добавьте квартиру, чтобы видеть
                статистику.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {apartments.map((a) => (
                  <li
                    key={a.apartmentId}
                    className="flex flex-col gap-2 rounded-[14px] bg-white p-4"
                  >
                    <span className="min-w-0 break-words font-medium text-[#1a1a2e]">
                      {a.title}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#f0e6f7] px-3 py-1 text-sm font-semibold text-[#8b3fa0]">
                        {a.views} 👁 просмотров
                      </span>
                      <span className="rounded-full bg-[#fdeaea] px-3 py-1 text-sm font-semibold text-[#b34a4a]">
                        {a.favorites} ❤ в избранном
                      </span>
                      <span className="rounded-full bg-[#e8f3e8] px-3 py-1 text-sm font-semibold text-[#3a7a3a]">
                        {a.bookings} 📅 броней
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </AuthGuard>
    </>
  );
}
