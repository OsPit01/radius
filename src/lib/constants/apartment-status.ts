// src/lib/constants/apartment-status.ts

// Порядок совпадает с реальным enum в БД: moderation, active, inactive.
export const APARTMENT_STATUS_VALUES = ['moderation', 'active', 'inactive'] as const;

export type ApartmentStatus = (typeof APARTMENT_STATUS_VALUES)[number];

// Record проверяет: на каждый статус ОБЯЗАТЕЛЬНО есть подпись и цвет.
export const APARTMENT_STATUS_INFO: Record<ApartmentStatus, { label: string; color: string }> = {
    moderation: { label: 'На модерации', color: '#f59e0b' },
    active: { label: 'Активен', color: '#22c55e' },
    inactive: { label: 'Неактивен', color: '#9ca3af' },
};

export function isApartmentStatus(value: string | null | undefined): value is ApartmentStatus {
    return typeof value === 'string' && Object.hasOwn(APARTMENT_STATUS_INFO, value);
}

export function getStatusInfo(status: string) {
    // Мусор → moderation, а не active: нельзя случайно показать объект опубликованным.
    return isApartmentStatus(status) ? APARTMENT_STATUS_INFO[status] : APARTMENT_STATUS_INFO.moderation;
}

export function buildStatusNotificationText(status: ApartmentStatus, reason?: string): string {
    if (status === 'active') {
        return 'Прошёл модерацию, поздравляем!';
    }
    if (status === 'inactive') {
        return reason ? `Отклонён. Причина: ${reason}` : 'Отклонён';
    }
    return 'На модерации';
}
