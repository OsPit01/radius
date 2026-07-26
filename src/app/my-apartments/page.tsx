"use client";
import "./page.css";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import Link from "next/link";
import Image from "next/image";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";

export default function MyApartmentsPage() {
  const { data: session } = useSession();
  const {
    data: myApartments,
    isLoading,
    error,
  } = api.apartment.getMyApartments.useQuery();

  // ===== НЕТ СЕССИИ =====
  if (!session) {
    return (
      <>
        <ClientHeader /> {/* ← ДОБАВИТЬ! */}
        <div className="my-apartments-page">
          <div className="empty-state">
            <p>Пожалуйста, войдите в систему</p>
            <Link href="/api/auth/signin" className="btn-primary">
              Войти
            </Link>
          </div>
        </div>
      </>
    );
  }

  // ===== ЗАГРУЗКА =====
  if (isLoading) {
    return (
      <>
        <ClientHeader />
        <div className="loading">Загрузка...</div>
      </>
    );
  }

  // ===== ОШИБКА =====
  if (error) {
    return (
      <>
        <ClientHeader />
        <div className="error">Ошибка: {error.message}</div>
      </>
    );
  }

  // ===== ОСНОВНОЙ РЕНДЕР =====
  const count = myApartments?.length ?? 0;

  return (
    <>
      <ClientHeader /> {/* ← ДОБАВИТЬ! */}
      <div className="my-apartments-page">
        <div className="page-header">
          <span className="page-title">Мои объекты</span>
          <span className="count-badge">{count}</span>
        </div>

        <p className="subtitle">
          Всего {count} {count === 1 ? "объявление" : "объявлений"}
        </p>

        {myApartments && myApartments.length > 0 ? (
          <div className="apartments-grid">
            {myApartments.map((item, index) => (
              <div key={item.apartment.id} className="apartments-card">
                <div className="image-wrapper">
                  <Image
                    src={item.apartment.image}
                    alt={item.apartment.title}
                    fill
                    className="apartment-image"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index < 3}
                    unoptimized
                  />
                </div>
                <div className="apartment-card-content">
                  <span className="apartment-title">
                    {item.apartment.title}
                  </span>
                  <p className="apartment-location">{item.apartment.city}</p>
                  <p className="apartment-price">
                    {item.apartment.price} {item.apartment.currency}
                  </p>
                  <Link
                    href={`/my-apartments/${item.apartment.id}/edit`}
                    className="btn-details"
                  >
                    Редактировать {/* ← ДОБАВИТЬ ТЕКСТ! */}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>У вас пока нет добавленных объектов</p>
            <Link href="/admin/add-apartment" className="btn-primary">
              ➕ Добавить квартиру {/* ← ДОБАВИТЬ ТЕКСТ! */}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
