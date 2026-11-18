export const MICRODISTRICTS_BY_CITY = {
    // Копище — не отдельный город, а пригород Минска (там же Новая Боровая):
    // его микрорайоны живут под Минском. Отдельного ключа «Копище» НЕТ.
    Минск: ['Немига', 'ЖД Вокзал', 'Маяк Минска', 'Новая Боровая', 'Минск Мир', 'Уручье'],
} as const;

type CityWithMicrodistricts = keyof typeof MICRODISTRICTS_BY_CITY;

function isKnownCity(city: string): city is CityWithMicrodistricts {
    return Object.hasOwn(MICRODISTRICTS_BY_CITY, city);
}
function normalizeMicrodistrictName(value: string): string {
    return value.trim().toLowerCase().replaceAll('ё', 'е');
}
export function getMicrodistricts(city: string): readonly string[] {
    return isKnownCity(city) ? MICRODISTRICTS_BY_CITY[city] : [];
}
export function getCanonicalMicrodistrict(city: string, value: string): string | null {
    const normalized = normalizeMicrodistrictName(value);
    return getMicrodistricts(city).find((name) => normalizeMicrodistrictName(name) === normalized) ?? null;
}
export function isMicrodistrictForCity(city: string, value: string): boolean {
    return getCanonicalMicrodistrict(city, value) !== null;
}
