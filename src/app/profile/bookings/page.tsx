"use client";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { api } from "@/trpc/react";
import { formatPhoneForDisplay } from "@/lib/phone";

const BOOKING_STATUS_LABELS: Record<string, string> = {
  new: "Новая заявка",
  approved: "Подтверждена",
  cancelled: "Отклонена",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BookingsPage() {
  const { data: bookings, isPending, isError } =
    api.bookings.listForOwner.useQuery();

  return (
    <AuthGuard>
      <ClientHeader />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-5">
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
                  <p className="font-semibold text-[#222]">
                    {apartment.title}
                  </p>
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
                    <p className="pt-1 text-[#888]">
                      «{booking.message}»
                    </p>
                  )}
                </div>

                <p className="mt-3 text-xs text-[#aaa]">
                  Создана {formatDate(booking.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AuthGuard>
  );
}
