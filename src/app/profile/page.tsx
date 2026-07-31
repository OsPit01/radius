"use client";
import { useSession } from "next-auth/react";
import { ClientHeader } from "../_components/layout/ClientHeader";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getRoleInfo } from "@/lib/constants/roles";
import Link from "next/link";
import "./profile.css";
type UserStats = {
  totalApartments: number;
  totalBookings: number;
  totalFavorites: number;
};
type UserProfile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  emailVerified: Date | null;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // ===== ПОЛУЧАЕМ ПОЛНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ИЗ БД =====

  const { data: userData, isLoading: isUserLoading } =
    api.user.getById.useQuery(
      {
        id: session?.user?.id ?? "", // ← ID ИЗ СЕССИИ
      },
      {
        enabled: !!session?.user?.id, // ← ЗАПРАШИВАЕМ ТОЛЬКО ЕСЛИ ЕСТЬ ID
      },
    );

  const { data: statsData } = api.user.getStats.useQuery(
    { userId: session?.user?.id ?? "" },
    {
      enabled: !!session?.user?.id,
    },
  );

  if (status === "loading") {
    return (
      <>
        <ClientHeader />
        <div className="profile-loading">Загрузка...</div>
      </>
    );
  }
  // Если нет сессии — перенаправляем на страницу входа
  if (!session) {
    router.push("/api/auth/signin");
    return null;
  }
  const user: UserProfile = {
    id: userData?.id ?? session.user.id,
    name: userData?.name ?? session.user.name ?? null,
    email: userData?.email ?? session.user.email,
    image: userData?.image ?? session.user.image ?? null,
    role: userData?.role ?? session.user.role ?? "user",
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
  const avatarUrl = user.image; // ← СНАЧАЛА ИЗ БД, ПОТОМ ИЗ СЕССИИПОЛЬЗОВАТЕЛЬ ИЗ СЕССИИ!
  return (
    <>
      <ClientHeader />
      <div className="profilepage">
        <div className="profile-container">
          {/* ====
               1. ШАПКА ПРОФИЛЯ (АВАТАР + ИМЯ + ПОЧТА + РОЛЬ)
               ====*/}
          <div className="profile-header">
            {/* АВАТАР */}
            <div className="profile-avatar-wrapper">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.role || "User"}
                  width={50}
                  height={50}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {user.name?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <div className="profile-info">
              <p className="profile-name">{user.name || "Пользователь"}</p>
              <p className="profile-email">{user.email}</p>
              <div className="profile-role">
                <span
                  className="role-badge"
                  style={{ background: roleInfo.color }}
                >
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number"> {stats.totalApartments}</div>
            <div className="stat-label">Объектов</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalBookings}</div>
            <div className="stat-label">Бронирований</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalFavorites}</div>
            <div className="stat-label">квартиры в избраном</div>
          </div>
          <div className="profile-menu">
            <Link href="/profile/settings" className="menu-item">
              <span className="menu-icon">⚙️</span>Настройки профиля
              <span className="menu-arrow">→</span>
            </Link>
            <Link href="/my-apartments" className="menu-item">
              <span className="menu-icon">🏠</span>Мои объекты
              <span className="menu-arrow">→</span>
            </Link>
            <Link href="/profile/bookings" className="menu-item">
              <span className="menu-icon">📅</span>Мои бронирования
              <span className="menu-arrow">→</span>
            </Link>
            <Link href="/profile/favorites" className="menu-item">
              <span className="menu-icon">❤️</span>Избранное
              <span className="menu-arrow">→</span>
            </Link>
            {(user.role === "admin" ||
              user.role === "superadmin" ||
              user.role === "mainadmin") && (
              <>
                <div className="menu-divider">Администрирование</div>
                <Link href="/admin/users" className="menu-item admin">
                  <span className="menu-icon">👥</span>Управление пользователями
                  <span className="menu-arrow">→</span>
                </Link>
                <Link href="/admin/moderation" className="menu-item admin">
                  <span className="menu-icon">🛡️</span>Модерация объектов
                  <span className="menu-arrow">→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
