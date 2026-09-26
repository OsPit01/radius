// src/lib/constants/booking.ts
// ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ по количеству гостей в бронировании.
// Используется: форма брони (BookingButton), поиск (SearchForm),
// страница квартиры (?guests=N из URL), валидация tRPC (bookings.create).

export const MIN_BOOKING_GUESTS = 1;

/** Максимум гостей в одной заявке. Жёсткое ограничение площадки. */
export const MAX_BOOKING_GUESTS = 20;

/** Сколько гостей подставлять, если в URL гость не указан. */
export const DEFAULT_BOOKING_GUESTS = 2;
