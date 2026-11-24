import { plural } from '@/utils/plural';

// ============================================================
// ПРИСУТСТВИЕ ПОЛЬЗОВАТЕЛЯ (онлайн / не в сети) — ЕДИНЫЙ ИСТОЧНИК
//
// «Онлайн» считается по lastSeenAt: heartbeat-хук обновляет его раз в
// минуту, пока вкладка открыта. Если с последнего обновления прошло
// больше ONLINE_WINDOW_MS — пользователь считается офлайн.
//
// Используется: админка (значок у пользователей), в перспективе —
// чаты, карточки объектов. Логика живёт здесь, чтобы везде
// совпадала и не «разъехалась».
// ============================================================

/** Сколько минут после последней активности пользователь считается онлайн. */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Онлайн ли пользователь.
 * lastSeenAt === null — никогда не заходил после появления трекинга → офлайн.
 */
export function isOnline(lastSeenAt: Date | null | undefined, now: Date = new Date()): boolean {
    if (!lastSeenAt) {
        return false;
    }
    return now.getTime() - lastSeenAt.getTime() < ONLINE_WINDOW_MS;
}

/**
 * Человекочитаемое «был(а) в сети X назад» для офлайн-пользователей.
 * null → «никогда не заходил». Границы: <1 мин → «только что»,
 * минуты → «5 мин назад», часы → «2 ч назад», дни → «3 дн назад»,
 * дальше — «более недели назад».
 */
export function formatLastSeen(lastSeenAt: Date | null | undefined, now: Date = new Date()): string {
    if (!lastSeenAt) {
        return 'никогда не заходил';
    }
    const diffMs = now.getTime() - lastSeenAt.getTime();
    if (diffMs < 0) {
        return 'только что';
    }
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) {
        return 'только что';
    }
    if (minutes < 60) {
        return `${minutes} ${plural(minutes, 'минуту', 'минуты', 'минут')} назад`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} ${plural(hours, 'час', 'часа', 'часов')} назад`;
    }
    const days = Math.floor(hours / 24);
    if (days <= 7) {
        return `${days} ${plural(days, 'день', 'дня', 'дней')} назад`;
    }
    return 'более недели назад';
}
