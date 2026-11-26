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
