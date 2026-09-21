"use client";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { api } from "@/trpc/react";
import { formatPhoneForDisplay } from "@/lib/phone";
import { Modal } from "@/app/_components/ui/Modal";
import { useState } from "react";
const BOOKING_STATUS_LABELS: Record<string, string> = {
  new: "Новая заявка",
  approved: "Подтверждена",
  cancelled: "Отклонена",
  rejected: "Отклонена",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BookingsPage() {
  const utils = api.useUtils();
  const {
    data: bookings,
    isPending,
    isError,
  } = api.bookings.listForOwner.useQuery();
  const setStatus = api.bookings.setStatus.useMutation({
    onSuccess: () => {
      void utils.bookings.listForOwner.invalidate();
    },
  });
  const [confirm, setConfirm] = useState<{
    bookingId: number;
    status: "approved" | "rejected";
  } | null>(null);

  return (
    <AuthGuard>
      <ClientHeader />
      <div className="mx-auto max-w-3xl px-4 pt-5 pb-16">
        <h1 className="mb-1 text-2xl font-bold text-[#222]">Мои брони</h1>
        <p className="mb-6 text-sm text-[#888]">
          Заявки, которые оставляют гости на ваших квартирах
        </p>

        {isPending && (
          <p className="py-8 text-center text-[#888]">Загрузка заявок...</p>
        )}

        {isError && (
          <p className="py-8 text-center text-red-600">
            Не удалось загрузить заявки. Попробуйте позже.
          </p>
        )}

        {!isPending && !isError && bookings?.length === 0 && (
          <p className="py-8 text-center text-[#888]">
            Пока нет ни одной заявки на бронирование.
          </p>
        )}

        {!isPending && !isError && bookings && (
          <ul className="flex flex-col gap-4">
            {bookings.map(({ booking, apartment }) => (
              <li
                key={booking.id}
                className="rounded-2xl border border-[#eee5f4] bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="font-semibold text-[#222]">{apartment.title}</p>
                  <span className="shrink-0 rounded-full bg-[#f6eefe] px-3 py-1 text-xs font-medium text-[#6b21a8]">
                    {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1 text-sm text-[#555]">
                  <p>
                    Гость:{" "}
                    <span className="font-medium text-[#222]">
                      {booking.guestName}
                    </span>
                  </p>
                  <p>
                    Телефон:{" "}
                    <a
                      href={`tel:${booking.guestPhone}`}
                      className="font-medium text-[#6b21a8]"
                    >
                      {formatPhoneForDisplay(booking.guestPhone)}
                    </a>
                  </p>
                  <p>Человек: {booking.guests}</p>
                  <p>
                    Заезд: {formatDate(booking.checkInDate)} — выезд:{" "}
                    {formatDate(booking.checkOutDate)}
                  </p>
                  {booking.message && (
                    <p className="pt-1 text-[#888]">«{booking.message}»</p>
                  )}
                </div>

                <p className="mt-3 text-xs text-[#aaa]">
                  Создана {formatDate(booking.createdAt)}
                </p>
                {booking.status === "new" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setConfirm({
                          bookingId: booking.id,
                          status: "approved",
                        })
                      }
                      className="mt-5 cursor-pointer rounded-[25px] border border-green-900 px-2 pr-2 text-black transition-all duration-300 hover:bg-green-700 hover:text-white"
                    >
                      Одобрить
                    </button>
                    <button
                      onClick={() =>
                        setConfirm({
                          bookingId: booking.id,
                          status: "rejected",
                        })
                      }
                      className="mt-5 cursor-pointer rounded-[25px] border border-red-900 px-2 text-black transition-all duration-300 hover:bg-red-700 hover:text-white"
                    >
                      Отклонить
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title="Подтвердите действие"
      >
        <p>
          Вы уверены, что хотите{" "}
          {confirm?.status === "approved" ? "Одобрить" : "Отклонить"} Заявку?
        </p>
        <div className="ml-2 flex gap-3">
          <button
            onClick={() => {
              setStatus.mutate(confirm!);
              setConfirm(null);
            }}
            className="mt-5 cursor-pointer rounded-[25px] border border-green-900 px-10 py-2.5 text-black transition-all duration-300 hover:bg-green-900 hover:text-white"
          >
            Да
          </button>
          <button
            onClick={() => setConfirm(null)}
            className="mt-5 cursor-pointer rounded-[25px] border border-red-900 px-10 py-2.5 text-black transition-all duration-300 hover:bg-red-700 hover:text-white"
          >
            Отмена
          </button>
        </div>
      </Modal>
    </AuthGuard>
  );
}
