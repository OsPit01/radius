// src/lib/constants/amenities.ts
export const AMENITIES = [
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'tv', label: 'Телевизор' },
    { id: 'cable', label: 'Кабельное ТВ' },
    { id: 'airConditioning', label: 'Кондиционер' },
    { id: 'heating', label: 'Отопление' },
    { id: 'washingMachine', label: 'Стиральная машина' },
    { id: 'dishwasher', label: 'Посудомоечная машина' },
    { id: 'fridge', label: 'Холодильник' },
    { id: 'microwave', label: 'Микроволновая печь' },
    { id: 'oven', label: 'Духовка' },
    { id: 'stove', label: 'Плита' },
    { id: 'coffeeMachine', label: 'Кофемашина' },
    { id: 'kettle', label: 'Чайник' },
    { id: 'hairDryer', label: 'Фен' },
    { id: 'iron', label: 'Утюг' },
    { id: 'ironingBoard', label: 'Гладильная доска' },
    { id: 'gameConsole', label: 'Игровая консоль' },
    { id: 'babyBed', label: 'Детская кроватка' },
];

export type Amenity = (typeof AMENITIES)[number];
