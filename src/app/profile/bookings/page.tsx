"use client";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { api } from "@/trpc/react";
import { formatPhoneForDisplay } from "@/lib/phone";
import { Modal } from "@/app/_components/ui/Modal";
import { useEffect, useState } from "react";
import { Tabs } from "./_components/ui/BookingTabs";

// Человекочитаемые подписи статусов брони.
const BOOKING_STATUS_LABELS: Record<string, string> = {
  new: "Новая заявка",
  approved: "Подтверждена",
  rejected: "Отклонена",
  cancelled: "Отменена",
  expired: "Истекла",
};

// Форматирование даты в человекочитаемый вид (например «30 октября 2026 г.»).
function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Полное имя владельца из ФИО (или fallback на name).
function ownerDisplayName(owner: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) {
  if (owner.firstName || owner.lastName) {
    return [owner.firstName, owner.lastName].filter(Boolean).join(" ");
  }
  return owner.name ?? "—";
}

export default function BookingsPage() {
  const utils = api.useUtils();

  // Заявки на мои квартиры (я — владелец).
  const {
    data: bookings,
    isPending,
    isError,
  } = api.bookings.listForOwner.useQuery();

  // Мои брони как гостя (я — арендатор).
  const {
    data: myBookings,
    isPending: isMyPending,
    isError: isMyError,
  } = api.bookings.listForUser.useQuery();

  // Одобрить / отклонить заявку (действие владельца).
  const setStatus = api.bookings.setStatus.useMutation({
    onSuccess: () => {
      void utils.bookings.listForOwner.invalidate();
    },
  });

  // Отменить бронь (действие гостя).
  const cancelBooking = api.bookings.cancel.useMutation({
    onSuccess: () => {
      void utils.bookings.listForUser.invalidate();
    },
  });

  // Автоотмена просроченных заявок (таймер 12ч) — ленивая проверка при загрузке.
  const expireBookings = api.bookings.expireBookings.useMutation({
    onSuccess: () => {
      void utils.bookings.listForOwner.invalidate();
      void utils.bookings.listForUser.invalidate();
    },
  });

  // При открытии страницы запускаем автоотмену просроченных заявок.
  useEffect(() => {
    expireBookings.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Подтверждение перед одобрением/отклонением.
  const [confirm, setConfirm] = useState<{
    bookingId: number;
    status: "approved" | "rejected";
  } | null>(null);

  // Режим: «Сдаю» (владелец) или «Снимаю» (гость).
  const [mode, setMode] = useState<"owner" | "guest">("owner");
  // Активная вкладка внутри режима.
  const [tab, setTab] = useState("new");

  // Выбираем данные текущего режима.
  const currentData = mode === "owner" ? bookings : myBookings;
  const currentPending = mode === "owner" ? isPending : isMyPending;
  const currentError = mode === "owner" ? isError : isMyError;

  // Вкладки статусов зависят от режима. У обеих сторон есть «Прошедшие».
  const statusTabs: { id: string; label: string }[] =
    mode === "owner"
      ? [
          { id: "new", label: "Новые" },
          { id: "approved", label: "Активные" },
          { id: "past", label: "Прошедшие" },
          { id: "rejected", label: "Отклонённые" },
        ]
      : [
          { id: "approved", label: "Активные" },
          { id: "past", label: "Прошедшие" },
          { id: "cancelled", label: "Отменённые" },
        ];

  // Фильтрация списка под выбранный режим и вкладку.
  const filtered = (currentData ?? []).filter(({ booking }) => {
    // Прошла ли дата выезда (одна и та же логика для обеих сторон).
    const isPast = new Date(booking.checkOutDate) < new Date();

    if (tab === "past") {
      // «Прошедшие» — те, у кого дата выезда уже в прошлом.
      return isPast;
    }
    if (tab === "approved") {
      // «Активные» — предстоящие. У гостя сюда же попадают заявки,
      // ожидающие подтверждения (status "new"), чтобы они не «терялись».
      if (mode === "guest") {
        return (
          (booking.status === "new" || booking.status === "approved") && !isPast
        );
      }
      return booking.status === "approved" && !isPast;
    }
    // «Отклонённые» / «Отменённые» — туда же показываем автоотменённые (expired),
    // чтобы заявка не «исчезала» после срабатывания таймера.
    if (tab === "rejected" || tab === "cancelled") {
      return booking.status === tab || booking.status === "expired";
    }
    // «Новые» — просто по статусу.
    return booking.status === tab;
  });

  return (
    <AuthGuard>
      <ClientHeader />
      {/* Переключатель «Сдаю / Снимаю» */}
      <div className="mx-auto max-w-3xl px-4 pt-2">
        <Tabs
          tabs={[
            { id: "owner", label: "Сдаю" },
            { id: "guest", label: "Снимаю" },
          ]}
          active={mode}
          onChange={(id) => {
            setMode(id);
            // При смене режима сбрасываем вкладку на дефолтную,
            // иначе старый tab может не существовать в новом режиме.
            setTab(id === "owner" ? "new" : "approved");
          }}
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* Вкладки статусов текущего режима */}
        <Tabs tabs={statusTabs} active={tab} onChange={setTab} />

        <h1 className="mb-1 pt-10 text-2xl font-bold text-[#222]">Мои брони</h1>
        <p className="mb-6 text-sm text-[#888]">
          Заявки, которые оставляют гости на ваших квартирах
        </p>

        {currentPending && (
          <p className="py-8 text-center text-[#888]">Загрузка заявок...</p>
        )}

        {currentError && (
          <p className="py-8 text-center text-red-600">
            Не удалось загрузить заявки. Попробуйте позже.
          </p>
        )}

        {!currentPending && !currentError && currentData?.length === 0 && (
          <p className="py-8 text-center text-[#888]">
            Пока нет ни одной заявки на бронирование.
          </p>
        )}

        {!currentPending && !currentError && (currentData?.length ?? 0) > 0 && (
          <>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-[#888]">
                В этом разделе пока нет заявок
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {filtered.map(({ booking, apartment, owner }) => (
                  <li
                    key={booking.id}
                    className="rounded-2xl border border-[#eee5f4] bg-white p-5 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <p className="font-semibold text-[#222]">
                        {apartment.title}
                      </p>
                      <span className="shrink-0 rounded-full bg-[#f6eefe] px-3 py-1 text-xs font-medium text-[#6b21a8]">
                        {BOOKING_STATUS_LABELS[booking.status] ??
                          booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-sm text-[#555]">
                      {/* Данные различаются: владелец видит гостя, гость — собственника */}
                      {mode === "owner" ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <p>
                            Собственник:{" "}
                            <span className="font-medium text-[#222]">
                              {ownerDisplayName(owner)}
                            </span>
                          </p>
                          {owner.phone && (
                            <p>
                              Телефон:{" "}
                              <a
                                href={`tel:${owner.phone}`}
                                className="font-medium text-[#6b21a8]"
                              >
                                {formatPhoneForDisplay(owner.phone)}
                              </a>
                            </p>
                          )}
                        </>
                      )}
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

                    {/* Кнопки действия зависят от режима */}
                    {mode === "owner" && booking.status === "new" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setConfirm({
                              bookingId: booking.id,
                              status: "approved",
                            })
                          }
                          className="mt-5 cursor-pointer rounded-[25px] border border-green-900 px-2 text-black transition-all duration-300 hover:bg-green-700 hover:text-white"
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
                    {mode === "guest" &&
                      (booking.status === "new" ||
                        booking.status === "approved") && (
                        <button
                          onClick={() =>
                            cancelBooking.mutate({ bookingId: booking.id })
                          }
                          className="mt-5 cursor-pointer rounded-[25px] border border-red-900 px-2 text-black transition-all duration-300 hover:bg-red-700 hover:text-white"
                        >
                          Отменить бронирование
                        </button>
                      )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Модалка подтверждения одобрения/отклонения */}
      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title="Подтвердите действие"
      >
        <p>
          Вы уверены, что хотите{" "}
          {confirm?.status === "approved" ? "одобрить" : "отклонить"} заявку?
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              if (confirm) {
                setStatus.mutate(confirm);
                setConfirm(null);
              }
            }}
            className="cursor-pointer rounded-[25px] border border-green-900 px-10 py-2.5 text-black transition-all duration-300 hover:bg-green-900 hover:text-white"
          >
            Да
          </button>
          <button
            onClick={() => setConfirm(null)}
            className="cursor-pointer rounded-[25px] border border-red-900 px-10 py-2.5 text-black transition-all duration-300 hover:bg-red-700 hover:text-white"
          >
            Отмена
          </button>
        </div>
      </Modal>
    </AuthGuard>
  );
}
