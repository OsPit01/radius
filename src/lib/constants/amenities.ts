// src/lib/constants/amenities.ts
export const AMENITY_VALUES = [
    'wifi',
    'tv',
    'cable',
    'airConditioning',
    'heating',
    'washingMachine',
    'dishwasher',
    'fridge',
    'microwave',
    'oven',
    'stove',
    'coffeeMachine',
    'kettle',
    'hairDryer',
    'iron',
    'ironingBoard',
    'gameConsole',
    'babyBed',
] as const;

export type Amenity = (typeof AMENITY_VALUES)[number];

// Record проверяет: на каждый id ОБЯЗАТЕЛЬНО есть подпись.
export const AMENITY_LABELS: Record<Amenity, string> = {
    wifi: 'Wi-Fi',
    tv: 'Телевизор',
    cable: 'Кабельное ТВ',
    airConditioning: 'Кондиционер',
    heating: 'Отопление',
    washingMachine: 'Стиральная машина',
    dishwasher: 'Посудомоечная машина',
    fridge: 'Холодильник',
    microwave: 'Микроволновая печь',
    oven: 'Духовка',
    stove: 'Плита',
    coffeeMachine: 'Кофемашина',
    kettle: 'Чайник',
    hairDryer: 'Фен',
    iron: 'Утюг',
    ironingBoard: 'Гладильная доска',
    gameConsole: 'Игровая консоль',
    babyBed: 'Детская кроватка',
};
// UI-массив выводится из корня: форма { id, label } сохраняется,
// поэтому Step3.tsx / Step3_Details.tsx / edit.tsx / ApartmentTabs не меняются.
export const AMENITIES = AMENITY_VALUES.map((id) => ({
    id,
    label: AMENITY_LABELS[id],
}));
export function isAmenity(value: string | null | undefined): value is Amenity {
    return typeof value === 'string' && Object.hasOwn(AMENITY_LABELS, value);
}
