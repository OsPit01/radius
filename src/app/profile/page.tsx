"use client";
import { useSession } from "next-auth/react";
import { AuthGuard } from "../_components/layout/AuthGuard";
import { api } from "@/trpc/react";
import Image from "next/image";
import { getRoleInfo, isAdminRole } from "@/lib/constants/roles";
import Link from "next/link";
type UserStats = {
  totalApartments: number;
  totalBookings: number;
  totalFavorites: number;
};
type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  emailVerified: Date | null;
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  // ===== ПОЛУЧАЕМ ПОЛНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ИЗ БД =====

  const { data: userData } = api.user.getById.useQuery(
    {
      id: userId, // ← ID ИЗ СЕССИИ
    },
    {
      enabled: !!userId, // ← ЗАПРАШИВАЕМ ТОЛЬКО ЕСЛИ ЕСТЬ ID
    },
  );

  const { data: statsData } = api.user.getStats.useQuery(
    { userId },
    {
      enabled: !!userId,
    },
  );

  const user: UserProfile = {
    id: userData?.id ?? session?.user.id ?? "",
    name: userData?.name ?? session?.user.name ?? null,
    email: userData?.email ?? session?.user.email ?? "",
    image: userData?.image ?? session?.user.image ?? null,
    role: userData?.role ?? session?.user.role ?? "user",
    emailVerified: userData?.emailVerified ?? null,
  };
  // ====
  // 3. ДАННЫЕ ИЗ СЕССИИ
  // ====
  const roleInfo = getRoleInfo(user.role);

  // ===== СТАТИСТИКА =====
  const stats: UserStats = {
    totalApartments: statsData?.stats?.totalApartments ?? 0,
    totalBookings: statsData?.stats?.totalBookings ?? 0,
    totalFavorites: statsData?.stats?.totalFavorites ?? 0,
  };
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[linear-gradient(135deg,#f5f0f7_0%,#e8e0f0_100%)] px-5 py-10 max-md:px-3 max-md:py-4">
        <div className="mx-auto max-w-[900px] rounded-[24px] bg-[#f6f6fa] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-md:rounded-[20px] max-md:p-6 max-[480px]:rounded-2xl max-[480px]:p-4">
          {/* ====
               1. ШАПКА ПРОФИЛЯ (АВАТАР + ИМЯ + ПОЧТА + РОЛЬ)
               ====*/}
          <div className="mb-2 flex items-center gap-10 rounded-[20px] border-b-2 border-[#f0ecf5] bg-white p-7 max-md:flex-col max-md:gap-5 max-md:p-5 max-md:text-center">
            {/* АВАТАР */}
            <div className="shrink-0">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.role || "User"}
                  width={50}
                  height={50}
                  className="h-20 w-20 rounded-full object-cover shadow-[0_4px_20px_rgba(181,82,199,0.2)] max-md:h-[75px] max-md:w-[75px] max-[480px]:h-20 max-[480px]:w-20"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-black bg-black text-[48px] font-bold text-white shadow-[0_4px_20px_rgba(181,82,199,0.2)] max-md:h-[75px] max-md:w-[75px] max-md:text-[40px] max-[480px]:h-20 max-[480px]:w-20 max-[480px]:text-[32px]">
                  {user.name?.charAt(0) ?? "U"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="m-0 text-[32px] font-bold text-[#1a1a2e] max-md:text-[26px] max-[480px]:text-[22px]">
                {user.name ?? "Пользователь"}
              </p>
              <p className="my-1 text-base text-black">
                {user.email}
              </p>
              <div className="flex items-center gap-2 max-md:justify-center">
                <span
                  className="inline-flex items-center gap-1.5 rounded-[30px] px-[18px] py-1.5 text-[13px] font-semibold uppercase tracking-[0.5px] text-white shadow-[0_4px_12px_rgba(49,53,50,0.658)]"
                  style={{ background: roleInfo.color }}
                >
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-1 grid grid-cols-3 gap-4 border-b-2 border-[#f0ecf5] py-7 max-md:grid-cols-1 max-md:gap-3">
            {[
              { value: stats.totalApartments, label: "Объектов" },
              { value: stats.totalBookings, label: "Бронирований" },
              { value: stats.totalFavorites, label: "квартиры в избраном" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="mt-[5px] rounded-2xl bg-white p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(181,82,199,0.1)]"
              >
                <div className="bg-[linear-gradient(135deg,black,#8b3fa0)] bg-clip-text text-xl font-extrabold leading-[1.2] text-transparent max-md:text-[28px]">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-0.5 pt-7">
            <Link
              href="/profile/settings"
              className="group flex cursor-pointer items-center gap-4 rounded-[14px] p-3.5 font-medium text-[#1a1a2e] no-underline transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-x-1.5 hover:bg-white max-[480px]:p-3 max-[480px]:text-sm"
            >
              <span className="w-8 shrink-0 text-center text-xl">⚙️</span>
              Настройки профиля
              <span className="ml-auto text-xl font-bold text-black transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/my-apartments"
              className="group flex cursor-pointer items-center gap-4 rounded-[14px] p-3.5 font-medium text-[#1a1a2e] no-underline transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-x-1.5 hover:bg-white max-[480px]:p-3 max-[480px]:text-sm"
            >
              <span className="w-8 shrink-0 text-center text-xl">🏠</span>
              Мои объекты
              <span className="ml-auto text-xl font-bold text-black transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/profile/bookings"
              className="group flex cursor-pointer items-center gap-4 rounded-[14px] p-3.5 font-medium text-[#1a1a2e] no-underline transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-x-1.5 hover:bg-white max-[480px]:p-3 max-[480px]:text-sm"
            >
              <span className="w-8 shrink-0 text-center text-xl">📅</span>
              Мои бронирования
              <span className="ml-auto text-xl font-bold text-black transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/profile/favorites"
              className="group flex cursor-pointer items-center gap-4 rounded-[14px] p-3.5 font-medium text-[#1a1a2e] no-underline transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-x-1.5 hover:bg-white max-[480px]:p-3 max-[480px]:text-sm"
            >
              <span className="w-8 shrink-0 text-center text-xl">❤️</span>
              Избранное
              <span className="ml-auto text-xl font-bold text-black transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-1">
                →
              </span>
            </Link>
            {isAdminRole(user.role) && (
              <>
                <div className="px-5 pb-2 pt-5 text-[11px] font-bold uppercase tracking-[0.8px] text-[#a5a0b5]">
                  Администрирование
                </div>
                <Link
                  href="/admin/users"
                  className="group flex cursor-pointer items-center gap-4 rounded-[14px] p-3.5 font-medium text-[#1a1a2e] no-underline transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-x-1.5 hover:bg-[#fef0f0] max-[480px]:p-3 max-[480px]:text-sm"
                >
                  <span className="w-8 shrink-0 text-center text-xl">👥</span>
                  Управление пользователями
                  <span className="ml-auto text-xl font-bold text-black transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/admin/moderation"
                  className="group flex cursor-pointer items-center gap-4 rounded-[14px] p-3.5 font-medium text-[#1a1a2e] no-underline transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-x-1.5 hover:bg-[#fef0f0] max-[480px]:p-3 max-[480px]:text-sm"
                >
                  <span className="w-8 shrink-0 text-center text-xl">🛡️</span>
                  Модерация объектов
                  <span className="ml-auto text-xl font-bold text-black transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
