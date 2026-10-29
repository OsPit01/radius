// src/lib/constants/apartment-status.ts
export const APARTMENT_STATUS = {
    active: { label: 'Активен', color: '#22c55e' },
    inactive: { label: 'Неактивен', color: '#9ca3af' },
    moderation: { label: 'На модерации', color: '#f59e0b' },
} as const;

export type ApartmentStatus = keyof typeof APARTMENT_STATUS;

export const APARTMENT_STATUS_VALUES = Object.keys(APARTMENT_STATUS) as [ApartmentStatus];

export function getStatusInfo(status: string) {
    return APARTMENT_STATUS[status as ApartmentStatus] ?? APARTMENT_STATUS.active;
}

export function buildStatusNotificationText(status: ApartmentStatus, title: string, reason?: string): string {
    if (status === 'active') {
        return `Ваш объект «${title}» прошёл модерацию, поздравляем!`;
    }
    if (status === 'inactive') {
        return reason ? `Ваш объект «${title}» отклонён. Причина: ${reason}` : `Ваш объект «${title}» отклонён`;
    }
    return `Ваш объект «${title}» на модерации`;
}
