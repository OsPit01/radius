// src/lib/constants/support.ts
// ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ по статусам обращений в поддержку.
// Используется: схема БД (pgEnum), tRPC-роутер support, карточка заявки в админке.

// Порядок совпадает с реальным enum в БД: open, closed.
// as const — литеральные типы: union 'open' | 'closed', а не общий string.
export const SUPPORT_TICKET_STATUS_VALUES = ['open', 'closed'] as const;

// Тип статуса выводится из кортежа: одно из двух значений и ничего больше.
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUS_VALUES)[number];

// Record проверяет: на КАЖДЫЙ статус ОБЯЗАТЕЛЬНО есть подпись и цвет бейджа.
// Забудем новый статус — TypeScript сам ругнётся (запись неполная).
export const SUPPORT_TICKET_STATUS_INFO: Record<SupportTicketStatus, { label: string; color: string }> = {
    open: { label: 'Открыта', color: '#22c55e' },
    closed: { label: 'Закрыта', color: '#9ca3af' },
};

// Type guard: строка из БД — это реальный статус или мусор?
// Object.hasOwn (а не in) — не ловим унаследованные свойства прототипа.
export function isSupportTicketStatus(value: string | null | undefined): value is SupportTicketStatus {
    return typeof value === 'string' && Object.hasOwn(SUPPORT_TICKET_STATUS_INFO, value);
}

// Безопасная подпись/цвет для ЛЮБОГО значения из БД:
// валидный статус → его инфо, мусор → безопасное «Открыта» по умолчанию.
export function getSupportTicketStatusInfo(status: string) {
    return isSupportTicketStatus(status) ? SUPPORT_TICKET_STATUS_INFO[status] : SUPPORT_TICKET_STATUS_INFO.open;
}
