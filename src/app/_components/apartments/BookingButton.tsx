"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/trpc/react";
import { Modal } from "@/app/_components/ui/Modal";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { getCountryCodePrefixFromNumber, isValidPhoneNumber, toE164 } from "@/lib/phone";
import { useSession } from "next-auth/react";
import {
  DEFAULT_BOOKING_GUESTS,
  MAX_BOOKING_GUESTS,
  MIN_BOOKING_GUESTS,
} from "@/lib/constants/booking";
import { pluralRu } from "@/lib/plural";
import Link from "next/link";
import { reportConversion } from "@/lib/analytics";

type BookingButtonProps = {
  apartmentId: number;
  apartmentTitle: string;
  /** Сколько гостей выбрано в поиске — стартовое значение поля. */
  initialGuests?: number;
  /** Сколько детей выбрано в поиске — стартовое значение поля «Дети». */
  initialChildren?: number;
  /** Вместимость квартиры — верхняя граница поля. */
  apartmentCapacity?: number;
};
type bookingFormErrors = {
  name?: string;
  phone?: string;
  dates?: string;
};
export function BookingButton({
  apartmentId,
  apartmentTitle,
  initialGuests = DEFAULT_BOOKING_GUESTS,
  initialChildren = 0,
  apartmentCapacity,
}: BookingButtonProps) {
  const { data: session } = useSession();
  // Данные авторизованного пользователя из БД — чтобы подтянуть его телефон.
  const userId = session?.user?.id ?? "";
  const { data: user } = api.user.getById.useQuery(
    { id: userId },
    { enabled: !!userId },
  );
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  // Последний известный "+код" страны ("+375", "+7" и т.д.). Храним в ref,
  // чтобы восстановить код, если пользователь его стёр. Работает для любой страны.
  const lastPhonePrefixRef = useRef("+375");
  // Не больше, чем вмещает квартира, но и не больше общего лимита площадки.
  const maxGuests = Math.min(
    apartmentCapacity ?? MAX_BOOKING_GUESTS,
    MAX_BOOKING_GUESTS,
  );
  // Стартовые значения гостей (приходят из поиска через URL ?guests&children).
  const initialChildrenCount = Math.min(
    Math.max(initialChildren, 0),
    maxGuests - MIN_BOOKING_GUESTS,
  );
  const initialAdultsCount = Math.min(
    Math.max(initialGuests - initialChildrenCount, MIN_BOOKING_GUESTS),
    maxGuests - initialChildrenCount,
  );
  const [adults, setAdults] = useState(initialAdultsCount);
  const [children, setChildren] = useState(initialChildrenCount);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<bookingFormErrors>({});

  useEffect(() => {
    // Подтягиваем имя авторизованного пользователя.
    const name = session?.user?.name;
    if (name) {
      setGuestName((prev) => prev || name);
    }
    // Подтягиваем телефон из профиля (БД) — только если поле ещё пустое.
    const phone = toE164(user?.phone);
    if (phone) {
      const prefix = getCountryCodePrefixFromNumber(phone);
      if (prefix) lastPhonePrefixRef.current = prefix;
      setGuestPhone((prev) => prev || phone);
    }
  }, [session, user]);

  const createBooking = api.bookings.create.useMutation({
    onSuccess: () => {
      reportConversion();
      setOpen(false);
      setGuestName(session?.user?.name ?? "");
      setGuestPhone("");
      setAdults(initialAdultsCount);
      setChildren(initialChildrenCount);
      setCheckInDate("");
      setCheckOutDate("");
      setMessage("");
    },
  });
  // Код страны стирать нельзя, причём для ЛЮБОЙ страны (не только BY/RU).
  // Если код потерян — восстанавливаем последний известный "+код".
  const handlePhoneChange = (value?: string) => {
    const next = value ?? "";

    // Начинается с «+» — запоминаем код страны (если удалось распознать)
    // и просто сохраняем значение.
    if (next.startsWith("+")) {
      const prefix = getCountryCodePrefixFromNumber(next);
      if (prefix) lastPhonePrefixRef.current = prefix;
      setGuestPhone(next);
      return;
    }

    // Код страны стёрли полностью. Восстанавливаем код + цифры номера.
    const digits = next.replace(/\D/g, "");
    const prefixDigits = lastPhonePrefixRef.current.slice(1);
    const national = digits.startsWith(prefixDigits)
      ? digits.slice(prefixDigits.length)
      : digits;
    setGuestPhone(lastPhonePrefixRef.current + national);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: bookingFormErrors = {};
    if (!guestName.trim()) newErrors.name = "Укажите имя";
    if (!isValidPhoneNumber(guestPhone))
      newErrors.phone = "Введите корректный номер телефона";
    if (!checkInDate || !checkOutDate)
      newErrors.dates = "Укажите даты заезда и выезда";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    createBooking.mutate({
      apartmentId,
      guestName: guestName.trim(),
      guestPhone,
      guests: adults + children,
      children,
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
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
            <label className="flex flex-col gap-1 text-sm font-medium text-[#222]">
              Телефон
              <PhoneInput
                international
                defaultCountry="BY"
                limitMaxLength
                value={guestPhone}
                onChange={handlePhoneChange}
                placeholder="Введите номер телефона"
                className="rounded-xl border border-[#e0e0e0] px-4 py-3 text-base text-[#222]"
              />
            </label>
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
            {/* Гости: взрослые и дети — отдельными степперами */}
            <div className="flex flex-col gap-2 text-sm font-medium text-[#222]">
              <div className="flex items-center justify-between gap-3">
                <span>Взрослые</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setAdults((a) => Math.max(MIN_BOOKING_GUESTS, a - 1))
                    }
                    disabled={adults <= MIN_BOOKING_GUESTS}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e0e0e0] text-xl font-bold text-[#222] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-lg font-semibold text-[#222]">
                    {adults}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAdults((a) => Math.min(maxGuests - children, a + 1))
                    }
                    disabled={adults + children >= maxGuests}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e0e0e0] text-xl font-bold text-[#222] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span>Дети</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setChildren((c) => Math.max(0, c - 1))}
                    disabled={children <= 0}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e0e0e0] text-xl font-bold text-[#222] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-lg font-semibold text-[#222]">
                    {children}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setChildren((c) => Math.min(maxGuests - adults, c + 1))
                    }
                    disabled={adults + children >= maxGuests}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e0e0e0] text-xl font-bold text-[#222] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {apartmentCapacity !== undefined && (
                <span className="text-xs font-normal text-[#888]">
                  Квартира вмещает до {apartmentCapacity}{" "}
                  {pluralRu(apartmentCapacity, "гостя", "гостей", "гостей")} —
                  больше указать нельзя.
                </span>
              )}
            </div>

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
            {errors.dates && (
              <p className="text-sm text-red-600">{errors.dates}</p>
            )}

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
              disabled={createBooking.isPending}
              className="mt-1 rounded-xl bg-gray-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createBooking.isPending ? "Отправляем..." : "Отправить заявку"}
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
