// ЕДИНЫЙ источник правил отображения броней по вкладкам.
// Раньше функция matchesFilter дублировалась на страницах гостя и арендодателя:
// стоило изменить условие в одном месте — и счётчики/списки разъезжались.
// Теперь и гость, и арендодатель используют одну и ту же функцию.

/** Идентификаторы вкладок, общие для обеих страниц бронирований. */
export const BOOKING_FILTER_IDS = ['all', 'pending', 'upcoming', 'staying', 'past', 'cancelled'] as const;
export type BookingFilterId = (typeof BOOKING_FILTER_IDS)[number];

/** Отменённые — сюда входят три статуса, которые больше не действуют. */
function isCancelledStatus(status: string): boolean {
    return status === 'cancelled' || status === 'rejected' || status === 'expired';
}

/**
 *
 * @param status статус брони из БД ('new' | 'approved' | ...).
 * @param checkInDate дата заезда (из БД приходит Date, но строка тоже допустима).
 * @param checkOutDate дата выезда.
 * @param filter идентификатор вкладки.
 * @param now текущий момент — передаётся страницей, чтобы все карточки
 *            сравнивались с ОДНОЙ датой, а не с «разными сейчас».
 *
 * Возвращает true/false: показывать бронь в этой вкладке или нет.
 */
/** Строка — одна из наших вкладок? (валидация на границе: вкладка из состояния/URL может быть мусором). */
export function isBookingFilterId(value: string | null | undefined): value is BookingFilterId {
    return typeof value === 'string' && (BOOKING_FILTER_IDS as readonly string[]).includes(value);
}
//  * Подходит ли бронь под вкладку.
export function matchesBookingFilter(
    status: string,
    checkInDate: Date | string,
    checkOutDate: Date | string,
    filter: string,
    now: Date,
): boolean {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const isCancelled = isCancelledStatus(status);

    // Валидация на границе: мусорная вкладка → 'all' (показать всё), а не «тихо в default».
    const f: BookingFilterId = isBookingFilterId(filter) ? filter : 'all';
    switch (f) {
        case 'pending': // ждёт решения владельца
            return status === 'new';
        case 'upcoming': // подтверждена, заезд ещё впереди
            return status === 'approved' && checkIn > now;
        case 'staying': // заезд наступил, выезд ещё нет (включая заезд сегодня)
            return status === 'approved' && checkIn <= now && now <= checkOut;
        case 'past': // завершилась ПОДТВЕРЖДЁННАЯ поездка
            return status === 'approved' && checkOut < now;
        case 'cancelled': // отмена владельцем/гостем или истечение срока
            return isCancelled;
        case 'all':
        default:
            return true;
    }
}
