// src/lib/booking-utils.ts
// Общие утилиты страниц бронирований (my-bookings, manage-bookings):
// форматирование дат и цвет статуса. Вынесены сюда, чтобы НЕ дублировать
// один и тот же код в двух страницах (один источник правды).

// «21 ноября 2026 г., 09:45» — дата создания (день + месяц + год + время).
export function formatFullDate(value: Date | string): string {
    return new Date(value).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// пример: « дата(создания) : 15 ноября» — даты проживания (день + полный месяц, без года).
export function formatShortDate(value: Date | string): string {
    return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// Цвет статуса: подтверждена — зелёный, ждёт ответа — жёлтый, отменена — красный.
export function statusColor(status: string): string {
    switch (status) {
        case 'approved':
            return 'text-success';
        case 'new':
            return 'text-warning';
        case 'cancelled':
        case 'rejected':
        case 'expired':
            return 'text-destructive';
        default:
            return 'text-foreground';
    }
}
