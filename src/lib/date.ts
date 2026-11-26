import { plural } from '@/utils/plural';
// ЕДИНАЯ точка форматирования дат и времени для показа человеку.
// Все страницы/компоненты берут формат ОТСЮДА, а не пишут toLocaleDateString
// вручную — иначе формат «разъезжается» (где-то «5 окт.», где-то «05.10»).

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
// Время/дата сообщения: сегодняшние показываем как «14:05», более старые — как «5 окт.».
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
// «Был(а) в сети X назад»: <1 мин → «только что», минуты → «5 мин назад»,
// часы → «2 ч назад», дни → «3 дн назад», дальше — «более недели назад».
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
