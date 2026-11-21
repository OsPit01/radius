// ===== Причины отмены брони — ЕДИНЫЙ ИСТОЧНИК =====
// Используется: показ «кто отменил» и причины в карточках броней,
// а в будущем — выбор причины при отмене (гость) и отклонении (владелец).
// Добавить/убрать причину = одна строка в списке ниже.

// Кто отменил → заголовок в карточке.
export const CANCELLED_BY_LABELS = {
    guest: 'Вы отменили бронь',
    owner: 'Арендодатель отменил заявку',
} as const;

export type CancelBy = keyof typeof CANCELLED_BY_LABELS;

/** Строка — одна из наших сторон отмены? (валидация на границе: из БД может прийти мусор). */
export function isCancelBy(value: string | null | undefined): value is CancelBy {
    return typeof value === 'string' && Object.hasOwn(CANCELLED_BY_LABELS, value);
}

/** Заголовок «кто отменил» по значению из БД. Мусор → null. */
export function cancelledByLabel(value: string | null | undefined): string | null {
    return isCancelBy(value) ? CANCELLED_BY_LABELS[value] : null;
}

// Возможные причины отмены по сторонам. Для будущего селекта при отмене/отклонении.
export const CANCEL_REASONS = {
    guest: ['Планы изменились', 'Нашёл другой вариант'],
    owner: [
        'Даты уже забронированы',
        'Заявка не соответствует условиям арендодателя и/или площадки',
        'Объект больше не сдаётся',
    ],
} as const;
