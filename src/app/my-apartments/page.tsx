"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { useMyApartments } from "./[id]/edit/hooks/useApartments";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { LoadingSpinner } from "@/app/_components/ui/LoadingSpinner";
import { Modal } from "@/app/_components/ui/Modal";
export default function MyApartmentsPage() {
  const { myApartments, isLoading, error, count, handleDelete, isDeleting } =
    useMyApartments();

  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);

  // ===== ЗАГРУЗКА =====
  if (isLoading) {
    return (
      <>
        <ClientHeader />
        <LoadingSpinner label="Загрузка..." />
      </>
    );
  }

  // ===== ОШИБКА =====
  if (error) {
    return (
      <AuthGuard>
        <div className="p-[60px_20px] text-center text-lg">
          Ошибка: {error.message}
        </div>
      </AuthGuard>
    );
  }

  // ===== ОСНОВНОЙ РЕНДЕР =====
  return (
    <>
      <AuthGuard>
        <ClientHeader />
        <div className="mx-auto max-w-[1200px] px-5 py-10 max-md:px-4 max-md:py-5">
          <div className="mb-2 flex flex-wrap items-center gap-4">
            <span className="text-[28px] font-bold text-[#222] max-md:text-[22px]">
              Мои объекты
            </span>
            <span className="rounded-[20px] bg-[#b552c7] px-3.5 py-0.5 text-base font-semibold text-white">
              {count}
            </span>
          </div>

          <p className="mb-8 text-base text-[#666]">
            Всего {count} {count === 1 ? "объявление" : "объявлений"}
          </p>

          {myApartments && myApartments.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 max-md:grid-cols-1">
              {myApartments.map((item, index) => (
                <div
                  key={item.apartment.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
                >
                  <div className="relative h-[300px] w-full overflow-hidden bg-[#f0f0f0] max-[480px]:aspect-square max-md:aspect-[16/9] max-md:h-auto">
                    <Image
                      src={item.apartment.image}
                      alt={item.apartment.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 3}
                      unoptimized
                    />
                  </div>
                  <div className="p-4">
                    <span className="mb-1 block text-lg leading-[1.3] font-semibold text-[#222]">
                      {item.apartment.title}
                    </span>
                    <p className="mb-2 text-sm text-[#666]">
                      {item.apartment.city}
                    </p>
                    <p className="mb-3 text-[22px] font-bold text-[#222] max-md:text-xl">
                      {item.apartment.price} {item.apartment.currency}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/my-apartments/${item.apartment.id}/edit`}
                        className="inline-block rounded-[30px] bg-[#1a0a2a] px-6 py-2.5 text-sm font-medium text-white no-underline transition-colors duration-200 hover:bg-[#4c2a6e] max-[480px]:w-full max-[480px]:text-center"
                      >
                        Редактировать
                      </Link>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            id: item.apartment.id,
                            title: item.apartment.title,
                          })
                        }
                        disabled={isDeleting}
                        className="cursor-pointer rounded-[30px] border-none bg-[#ef4444] px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-50 max-[480px]:w-full max-[480px]:text-center"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#f8f8f8] p-[80px_20px] text-center">
              <p className="mb-5 text-lg text-[#666]">
                У вас пока нет добавленных объектов
              </p>
              <Link
                href="/admin/add-apartment"
                className="inline-block cursor-pointer rounded-[30px] border-none bg-[#b552c7] px-8 py-3 text-base font-semibold text-white no-underline transition-colors duration-200 hover:bg-[#9a3fb0] max-[480px]:w-full max-[480px]:text-center"
              >
                ➕ Добавить квартиру
              </Link>
            </div>
          )}
        </div>
      </AuthGuard>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Удалить объект"
      >
        <p className="text-base text-[#1a1a2e]">
          Вы уверены, что хотите удалить «{deleteTarget?.title}»?
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (deleteTarget) handleDelete(deleteTarget.id);
              setDeleteTarget(null);
            }}
            disabled={isDeleting}
            className="cursor-pointer rounded-[30px] bg-[#ef4444] px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#dc2626] disabled:opacity-50"
          >
            {isDeleting ? "Удаление..." : "Да, удалить"}
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="cursor-pointer rounded-[30px] border border-[#ddd] px-6 py-2.5 text-base font-semibold text-[#1a1a2e] transition-colors hover:bg-gray-100"
          >
            Отмена
          </button>
        </div>
      </Modal>
    </>
  );
}
