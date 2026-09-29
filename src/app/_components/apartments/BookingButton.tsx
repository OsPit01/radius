"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Modal } from "@/app/_components/ui/Modal";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "@/lib/phone";
import { useSession } from "next-auth/react";
import {
  DEFAULT_BOOKING_GUESTS,
  MAX_BOOKING_GUESTS,
  MIN_BOOKING_GUESTS,
} from "@/lib/constants/booking";
import { pluralRu } from "@/lib/plural";
import Link from "next/link";

type BookingButtonProps = {
  apartmentId: number;
  apartmentTitle: string;
  /** Сколько гостей выбрано в поиске — стартовое значение поля. */
  initialGuests?: number;
  /** Вместимость квартиры — верхняя граница поля. */
  apartmentCapacity?: number;
};

export function BookingButton({
  apartmentId,
  apartmentTitle,
  initialGuests = DEFAULT_BOOKING_GUESTS,
  apartmentCapacity,
}: BookingButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  // Не больше, чем вмещает квартира, но и не больше общего лимита площадки.
  const maxGuests = Math.min(
    apartmentCapacity ?? MAX_BOOKING_GUESTS,
    MAX_BOOKING_GUESTS,
  );
  const [guests, setGuests] = useState(() =>
    Math.min(Math.max(initialGuests, MIN_BOOKING_GUESTS), maxGuests),
  );
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [message, setMessage] = useState("");

  const createBooking = api.bookings.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setGuestName("");
      setGuestPhone("");
      setGuests(
        Math.min(Math.max(initialGuests, MIN_BOOKING_GUESTS), maxGuests),
      );
      setCheckInDate("");
      setCheckOutDate("");
      setMessage("");
    },
  });

  const submitDisabled =
    !guestName.trim() ||
    !isValidPhoneNumber(guestPhone) ||
    !checkInDate ||
    !checkOutDate ||
    createBooking.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitDisabled) return;
    createBooking.mutate({
      apartmentId,
      guestName: guestName.trim(),
      guestPhone,
      guests,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      message: message.trim() || undefined,
    });
  };

  return (
    <>
      {session ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-800 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
        >
          Забронировать
        </button>
      ) : (
        <Link
          href="/auth/signin"
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-800 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
        >
          Забронировать
        </Link>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Бронирование">
        {createBooking.isSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="text-4xl">✅</div>
            <p className="text-lg font-semibold text-[#222]">
              Заявка отправлена!
            </p>
            <p className="text-sm text-[#888]">
              Владелец увидит вашу заявку в Telegram и свяжется с вами.
            </p>
            <button
              type="button"
              onClick={() => createBooking.reset()}
              className="mt-2 rounded-xl border border-[#6b21a8] px-6 py-2 text-sm font-medium text-[#6b21a8] hover:bg-[#f6eefe]"
            >
              Хорошо
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <p className="text-sm text-[#888]">
              Квартира:{" "}
              <span className="font-medium text-[#222]">{apartmentTitle}</span>
            </p>

            <label className="flex flex-col gap-1 text-sm font-medium text-[#222]">
              Ваше имя
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Например, Иван"
                className="rounded-xl border border-[#e0e0e0] px-4 py-3 text-base text-[#222] outline-none focus:border-[#6b21a8]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-[#222]">
              Телефон
              <PhoneInput
                international
                countries={["BY", "RU"]}
                defaultCountry="BY"
                value={guestPhone}
                onChange={(value) => setGuestPhone(value ?? "")}
                placeholder="Введите номер телефона"
                className="rounded-xl border border-[#e0e0e0] px-4 py-3 text-base text-[#222]"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-[#222]">
              Количество гостей
              <input
                type="number"
                min={MIN_BOOKING_GUESTS}
                max={maxGuests}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="rounded-xl border border-[#e0e0e0] px-4 py-3 text-base text-[#222] outline-none focus:border-[#6b21a8]"
              />
              {apartmentCapacity !== undefined && (
                <span className="text-xs font-normal text-[#888]">
                  Квартира вмещает до {apartmentCapacity}{" "}
                  {pluralRu(apartmentCapacity, "гостя", "гостей", "гостей")} —
                  больше указать нельзя.
                </span>
              )}
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-[#222]">
                Заезд
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="rounded-xl border border-[#e0e0e0] px-3 py-3 text-base text-[#222] outline-none focus:border-[#6b21a8]"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-[#222]">
                Выезд
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="rounded-xl border border-[#e0e0e0] px-3 py-3 text-base text-[#222] outline-none focus:border-[#6b21a8]"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm font-medium text-[#222]">
              Комментарий (необязательно)
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Например, время приезда, вопросы..."
                className="resize-none rounded-xl border border-[#e0e0e0] px-4 py-3 text-base text-[#222] outline-none focus:border-[#6b21a8]"
              />
            </label>

            {createBooking.isError && (
              <p className="text-sm text-red-600">
                {createBooking.error.message ?? "Не удалось отправить заявку"}
              </p>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="mt-1 rounded-xl bg-gray-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-[#c4b5fd]"
            >
              {createBooking.isPending ? "Отправляем..." : "Отправить заявку"}
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
