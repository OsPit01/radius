// src/lib/plural.ts

/**
 * Русское склонение числительных: pluralRu(2, "гость", "гостя", "гостей") → "гостя"
 *
 * Как это работает: в русском выбор формы зависит от двух последних цифр числа.
 *   1, 21, 31, 101      → одна форма   («1 гость», «21 гость»)
 *   2, 3, 4, 22, 23     → вторая форма («2 гостя», «23 гостя»)
 *   5–20, 25–30, 100…   → третья форма  («5 гостей», «11 гостей»)
 */
export function pluralRu(count: number, one: string, few: string, many: string): string {
    const abs = Math.abs(count);
    const lastDigit = abs % 10;
    const lastTwoDigits = abs % 100;

    if (lastDigit === 1 && lastTwoDigits !== 11) {
        return one;
    }
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
        return few;
    }
    return many;
}
