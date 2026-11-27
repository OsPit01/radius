// Форма бронирования внутри модалки — ЧИСТАЯ ВЁРСТКА.
// Вся логика (состояния, валидация, мутация) живёт в хуке useBookingForm,
// сюда приходит готовый объект form. Компонент ничего не решает — только рисует.

import 'react-phone-number-input/style.css';

import PhoneInput from 'react-phone-number-input';

import { Minus, Plus } from '@/components/icons';
import type { useBookingForm } from '@/hooks/useBookingForm';
import { isTripPurpose, MIN_BOOKING_GUESTS, TRIP_PURPOSE_LABELS, TRIP_PURPOSE_VALUES } from '@/lib/constants/booking';
import { plural } from '@/utils/plural';

type BookingFormProps = {
    /** Объект из useBookingForm: состояния + обработчики. */
    form: ReturnType<typeof useBookingForm>;
};

export function BookingForm({ form }: BookingFormProps) {
    return (
        <form
            onSubmit={form.handleSubmit}
            className="flex flex-col gap-3"
        >
            <p className="text-sm text-muted-foreground">
                Квартира: <span className="font-medium text-foreground">{form.apartmentTitle}</span>
            </p>

            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Ваше имя
                <input
                    type="text"
                    value={form.guestName}
                    onChange={(e) => form.setGuestName(e.target.value)}
                    placeholder="Например, Иван"
                    className="rounded-xl border border-border px-4 py-3 text-base text-foreground outline-none focus:border-primary"
                />
            </label>
            {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}

            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Телефон
                <PhoneInput
                    international
                    country={form.country}
                    onCountryChange={(c) => c && form.setCountry(c)}
                    defaultCountry="BY"
                    limitMaxLength
                    maxLength={form.exampleNumber?.length}
                    value={form.guestPhone}
                    onChange={form.handlePhoneChange}
                    placeholder={form.exampleNumber ?? '+375 29 123-45-67'}
                    className="rounded-xl border border-border px-4 py-3 text-base text-foreground"
                />
                {form.exampleNumber && (
                    <span className="text-xs font-normal text-muted-foreground">Формат: {form.exampleNumber}</span>
                )}
            </label>
            {form.errors.phone && <p className="text-sm text-destructive">{form.errors.phone}</p>}

            {/* Гости: взрослые и дети — отдельными степперами */}
            <div className="flex flex-col gap-2 text-sm font-medium text-foreground">
                <div className="flex items-center justify-between gap-3">
                    <span>Взрослые</span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => form.setAdults((a) => Math.max(MIN_BOOKING_GUESTS, a - 1))}
                            disabled={form.adults <= MIN_BOOKING_GUESTS}
                            aria-label="Уменьшить число взрослых"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-xl font-bold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Minus className="h-5 w-5" />
                        </button>
                        <span className="min-w-8 text-center text-lg font-semibold text-foreground">{form.adults}</span>
                        <button
                            type="button"
                            onClick={() => form.setAdults((a) => Math.min(form.maxGuests - form.children, a + 1))}
                            disabled={form.adults + form.children >= form.maxGuests}
                            aria-label="Увеличить число взрослых"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-xl font-bold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <span>Дети</span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => form.setChildren((c) => Math.max(0, c - 1))}
                            disabled={form.children <= 0}
                            aria-label="Уменьшить число детей"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-xl font-bold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Minus className="h-5 w-5" />
                        </button>
                        <span className="min-w-8 text-center text-lg font-semibold text-foreground">
                            {form.children}
                        </span>
                        <button
                            type="button"
                            onClick={() => form.setChildren((c) => Math.min(form.maxGuests - form.adults, c + 1))}
                            disabled={form.adults + form.children >= form.maxGuests}
                            aria-label="Увеличить число детей"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-xl font-bold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {form.apartmentCapacity !== undefined && (
                    <span className="text-xs font-normal text-muted-foreground">
                        Квартира вмещает до {form.apartmentCapacity}{' '}
                        {plural(form.apartmentCapacity, 'гостя', 'гостей', 'гостей')} — больше указать нельзя.
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                    Заезд
                    <input
                        type="date"
                        value={form.checkInDate}
                        min={form.today}
                        onChange={(e) => {
                            const next = e.target.value;
                            form.setCheckInDate(next);
                            // Заезд сдвинули так, что выезд стал не позже него — сбрасываем выезд.
                            if (form.checkOutDate && form.checkOutDate <= next) {
                                form.setCheckOutDate('');
                            }
                        }}
                        className="rounded-xl border border-border px-3 py-3 text-base text-foreground outline-none focus:border-primary"
                    />
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                    Выезд
                    <input
                        type="date"
                        value={form.checkOutDate}
                        min={form.minCheckOut}
                        onChange={(e) => form.setCheckOutDate(e.target.value)}
                        className="rounded-xl border border-border px-3 py-3 text-base text-foreground outline-none focus:border-primary"
                    />
                </label>
            </div>
            {form.errors.dates && <p className="text-sm text-destructive">{form.errors.dates}</p>}

            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Цель поездки (необязательно)
                <select
                    value={form.tripPurpose}
                    onChange={(e) =>
                        // Валидация на границе: из select приходит строка —
                        // пропускаем только реальные цели, мусор → ''.
                        form.setTripPurpose(isTripPurpose(e.target.value) ? e.target.value : '')
                    }
                    className="cursor-pointer rounded-xl border border-border px-4 py-3 text-base text-foreground outline-none focus:border-primary"
                >
                    <option value="">Не указывать</option>
                    {TRIP_PURPOSE_VALUES.map((value) => (
                        <option
                            key={value}
                            value={value}
                        >
                            {TRIP_PURPOSE_LABELS[value]}
                        </option>
                    ))}
                </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Комментарий (необязательно)
                <textarea
                    value={form.message}
                    onChange={(e) => form.setMessage(e.target.value)}
                    rows={3}
                    placeholder="Например, время приезда, вопросы..."
                    className="resize-none rounded-xl border border-border px-4 py-3 text-base text-foreground outline-none focus:border-primary"
                />
            </label>

            {form.isError && (
                // role="alert": ошибка отправки озвучивается скринридером сразу.
                <p
                    role="alert"
                    className="text-sm text-destructive"
                >
                    {form.errorMessage}
                </p>
            )}

            <button
                type="submit"
                disabled={form.isPending}
                className="mt-1 cursor-pointer rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {form.isPending ? 'Отправляем...' : 'Отправить заявку'}
            </button>
        </form>
    );
}
