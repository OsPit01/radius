// src/lib/constants/parking.ts
export const PARKING_TYPES = [
    { id: 'free', label: 'Бесплатная' },
    { id: 'paid', label: 'Платная' },
    { id: 'underground', label: 'Подземная' },
    { id: 'guarded', label: 'Охраняемая' },
    { id: 'absent', label: 'Нету' },
];

export type ParkingType = (typeof PARKING_TYPES)[number];
