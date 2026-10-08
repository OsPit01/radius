"use client";

import { useSession } from "next-auth/react";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { api } from "@/trpc/react";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { isAdminRole } from "@/lib/constants/roles";

export default function StatisticsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const { data: myStats } = api.analytics.getMyApartmentStats.useQuery();

  const { data: siteStats } = api.analytics.getSiteStats.useQuery(undefined, {
    enabled: isAdminRole(role),
  });

  const cards = [
    {
      value: isAdminRole(role) ? (siteStats?.totalVisits ?? 0) : 0,
      label: "Уникальных переходов на сайт",
      hidden: !isAdminRole(role),
    },
    { value: myStats?.totalViews ?? 0, label: "Просмотров квартир" },
    { value: myStats?.totalBookings ?? 0, label: "Бронирований" },
    { value: myStats?.totalFavorites ?? 0, label: "Добавлений в избранное" },
  ].filter((c) => !c.hidden);

  const apartments = myStats?.perApartment ?? [];

  return (
    <>
      <AuthGuard>
        <ClientHeader />
        <div className="min-h-screen bg-[linear-gradient(135deg,#f5f0f7_0%,#e8e0f0_100%)] px-5 py-10 max-md:px-3 max-md:py-4">
          <div className="mx-auto max-w-[900px] rounded-[24px] bg-[#f6f6fa] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-[480px]:rounded-2xl max-[480px]:p-4 max-md:rounded-[20px] max-md:p-6">
            <h1 className="mb-6 text-[28px] font-bold text-[#1a1a2e] max-md:text-[22px]">
              📊 Статистика
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
              Просмотры по квартирам
            </h2>
            {apartments.length === 0 ? (
              <p className="text-sm text-[#777]">
                У вас пока нет объектов — добавьте квартиру, чтобы видеть
                статистику просмотров.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {apartments.map((a) => (
                  <li
                    key={a.apartmentId}
                    className="flex items-center justify-between gap-3 rounded-[14px] bg-white p-4"
                  >
                    <span className="min-w-0 break-words font-medium text-[#1a1a2e]">
                      {a.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-[#f0e6f7] px-3 py-1 text-sm font-semibold text-[#8b3fa0]">
                      {a.views} 👁
                    </span>
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
