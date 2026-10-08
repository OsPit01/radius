"use client";

import { useSession } from "next-auth/react";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { api } from "@/trpc/react";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { isAdminRole } from "@/lib/constants/roles";

// Общая статистика по всему сайту — только для администрации.
// Сама процедура analytics.getSiteStats дополнительно проверяет роль на сервере.
export default function AdminStatisticsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  // Запрашиваем только если я админ (сервер всё равно проверит повторно).
  const { data: siteStats } = api.analytics.getSiteStats.useQuery(undefined, {
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

  return (
    <AuthGuard>
      <ClientHeader />
      <div className="min-h-screen bg-[linear-gradient(135deg,#f5f0f7_0%,#e8e0f0_100%)] px-5 py-10 max-md:px-3 max-md:py-4">
        <div className="mx-auto max-w-[900px] rounded-[24px] bg-[#f6f6fa] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-[480px]:rounded-2xl max-[480px]:p-4 max-md:rounded-[20px] max-md:p-6">
          <h1 className="mb-6 text-[28px] font-bold text-[#1a1a2e] max-md:text-[22px]">
            📊 Общая статистика сайта
          </h1>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <div className="rounded-2xl bg-white p-5 text-center">
              <div className="bg-[linear-gradient(135deg,black,#8b3fa0)] bg-clip-text text-2xl leading-[1.2] font-extrabold text-transparent max-md:text-[24px]">
                {siteStats?.totalVisits ?? 0}
              </div>
              <div className="mt-1 text-sm font-medium text-[#555]">
                Уникальных переходов на сайт
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
