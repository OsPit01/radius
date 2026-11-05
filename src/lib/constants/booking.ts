// src/lib/constants/booking.ts
// ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ по количеству гостей в бронировании.
// Используется: форма брони (BookingButton), поиск (SearchForm),
// страница квартиры (?guests=N из URL), валидация tRPC (bookings.create).

export const MIN_BOOKING_GUESTS = 1;

/** Максимум гостей в одной заявке. Жёсткое ограничение площадки. */
export const MAX_BOOKING_GUESTS = 20;

/** Сколько гостей подставлять, если в URL гость не указан. */
export const DEFAULT_BOOKING_GUESTS = 2;

export const BOOKING_STATUS_VALUES = [
    'new', // ждёт ответа владельца
    'approved', // владелец подтвердил
    'rejected', // владелец отклонил
    'cancelled', // отменена гостем или владельцем
    'expired', // просрочена — владелец не ответил
] as const;

export type BookingStatus = (typeof BOOKING_STATUS_VALUES)[number];
// Для одной заявки: «Новая заявка», «Подтверждена»...
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
    new: 'Новая заявка',
    approved: 'Подтверждена',
    rejected: 'Отклонена',
    cancelled: 'Отменена',
    expired: 'Истекла',
};
// Для статистики: «Новые», «Подтверждены»..
export const BOOKING_STATUS_PLURAL_LABELS: Record<BookingStatus, string> = {
    new: 'Новые',
    approved: 'Подтверждены',
    rejected: 'Отклонены',
    cancelled: 'Отменены',
    expired: 'Истекли',
};
export function isBookingStatus(value: string | null | undefined): value is BookingStatus {
    return typeof value === 'string' && Object.hasOwn(BOOKING_STATUS_LABELS, value);
}
