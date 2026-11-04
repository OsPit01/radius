// src/lib/constants/parking.ts
export const PARKING_TYPE_VALUES = ['free', 'paid', 'underground', 'guarded', 'absent'] as const;

export type ParkingType = (typeof PARKING_TYPE_VALUES)[number];
// Record проверяет: на каждый код ОБЯЗАТЕЛЬНО есть подпись.
export const PARKING_TYPE_LABELS: Record<ParkingType, string> = {
    free: 'Бесплатная',
    paid: 'Платная',
    underground: 'Подземная',
    guarded: 'Охраняемая',
    absent: 'Нету',
};

// UI-массив выводится из корня: форма { id, label } сохраняется.
export const PARKING_TYPES = PARKING_TYPE_VALUES.map((id) => ({ id, label: PARKING_TYPE_LABELS[id] }));

export function isParkingType(value: string | null | undefined): value is ParkingType {
    return !!value && Object.hasOwn(PARKING_TYPE_LABELS, value);
}
