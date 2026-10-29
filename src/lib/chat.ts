// ============================================================
// Общие типы и хелперы для чата.
// Вынесены сюда, чтобы не дублировать логику в компонентах.
// ============================================================

/**
 * Максимальная длина одного сообщения в чате.
 * ОДИН источник правды: это число используют и сервер (валидация Zod
 * в роутерах chat/support), и фронт (атрибут maxLength + счётчик символов).
 * Раньше сервер проверял max(500), а фронт вообще не ограничивал ввод —
 * пользователь мог набрать 1000 символов и получить уродливую ошибку.
 */
export const MAX_MESSAGE_LENGTH = 500;

/** Данные одного участника чата (гость или владелец). null — пользователь удалён. */
export type ChatPerson = {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
} | null;

/** Полное имя участника: «Имя Фамилия», иначе name, иначе «Собеседник». */
export function displayName(person: ChatPerson): string {
    if (!person) {
        return 'Собеседник';
    }
    if (person.firstName || person.lastName) {
        return [person.firstName, person.lastName].filter(Boolean).join(' ');
    }
    return person.name ?? 'Собеседник';
}

/** Первая буква имени — для аватара без фото. */
export function avatarInitial(person: ChatPerson): string {
    return displayName(person).charAt(0).toUpperCase();
}

/**
 * Время/дата сообщения: сегодняшние показываем как «14:05»,
 * более старые — как «5 окт.».
 */
export function formatChatDate(date: Date): string {
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/** Диапазон дат брони для шапки чата: «5 окт. — 7 окт.». */
export function formatBookingDates(checkIn: Date, checkOut: Date): string {
    const fmt = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    return `${fmt(checkIn)} — ${fmt(checkOut)}`;
}
