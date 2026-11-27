// ===== Причины отмены брони — ЕДИНЫЙ ИСТОЧНИК =====
// Используется: показ «кто отменил» и причины в карточках броней,
// а в будущем — выбор причины при отмене (гость) и отклонении (владелец).
// Добавить/убрать причину = одна строка в списке ниже.

// Кто может отменить бронь. Кортеж as const — из него выводятся и тип CancelBy,
// и pgEnum в БД (booking.ts). Один источник: добавление стороны = одна строка здесь.
export const CANCEL_BY_VALUES = ['guest', 'owner'] as const;

export type CancelBy = (typeof CANCEL_BY_VALUES)[number];

// Кто отменил → заголовок в карточке. Record<CancelBy, string> — компилятор
// гарантирует, что на КАЖДУЮ сторону есть подпись (забыл — ошибка типов).
export const CANCELLED_BY_LABELS: Record<CancelBy, string> = {
    guest: 'Вы отменили бронь',
    owner: 'Арендодатель отменил заявку',
};
// Что видит тот, КТО отменил (про себя).
export const CANCELLED_BY_SELF_LABELS: Record<CancelBy, string> = {
    guest: 'Вы отменили бронирование:',
    owner: 'Арендодатель отменил бронирование:',
};
// Что видит ДРУГАЯ сторона (про того, кто отменил)
export const CANCELLED_BY_OTHER_LABELS: Record<CancelBy, string> = {
    guest: 'Гость отменил бронирование:',
    owner: 'Арендодатель отклонил заявку:',
};

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
