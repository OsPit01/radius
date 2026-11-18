export const MICRODISTRICTS_BY_CITY = {
    // Копище — не отдельный город, а пригород Минска (там же Новая Боровая):
    // его микрорайоны живут под Минском. Отдельного ключа «Копище» НЕТ.
    Минск: [
        'Немига',
        'ЖД Вокзал',
        'Маяк Минска',
        {
            name: 'Новая Боровая',
            blurb: 'Новая Боровая — современный жилой комплекс с зелёными дворами, велодорожками, магазинами и кафе у лесопарка. Отсюда 20 минут на машине до центра Минска.',
        },
        'Минск Мир',
        'Уручье',
    ],
} as const satisfies Record<string, readonly Microdistrict[]>;

// Район — либо просто строка ('Немига'), либо объект с рукописным описанием.
// Строка = «текста нет, страница района живёт на живых данных» (цены, метро).
// Объект = району добавляется 1-2 предложения человечины — уникальность для SEO.
type Microdistrict = string | { name: string; blurb: string };
type CityWithMicrodistricts = keyof typeof MICRODISTRICTS_BY_CITY;

function isKnownCity(city: string): city is CityWithMicrodistricts {
    return Object.hasOwn(MICRODISTRICTS_BY_CITY, city);
}
function normalizeMicrodistrictName(value: string): string {
    return value.trim().toLowerCase().replaceAll('ё', 'е');
}
/** «Достань имя района»: элемент справочника бывает строкой или объектом —
 *  этот помощник возвращает имя в обоих случаях. Нужен везде, где справочник
 *  читают (сравнение, поиск, плитки): старый код ждал строку, теперь нет. */
export function microdistrictName(entry: Microdistrict): string {
    return typeof entry === 'string' ? entry : entry.name;
}

/** Список районов города (в исходных видах: строки и объекты). */
export function getMicrodistricts(city: string): readonly Microdistrict[] {
    return isKnownCity(city) ? MICRODISTRICTS_BY_CITY[city] : [];
}
/** Каноническое написание района по любому вводу: ' МАЯК минска ' → 'Маяк Минска'.
 *  Проглаживаем ввод и каждый элемент справочника (через microdistrictName —
 *  объект проглаживаем по его имени), сравниваем, возвращаем ОРИГИНАЛ. */
export function getCanonicalMicrodistrict(city: string, value: string): string | null {
    const normalized = normalizeMicrodistrictName(value);
    const found = getMicrodistricts(city).find(
        (entry) => normalizeMicrodistrictName(microdistrictName(entry)) === normalized,
    );
    // Возвращаем имя (не объект): остальной код работает со строками.
    return found ? microdistrictName(found) : null;
}

/** Рукописное описание района (blurb) или null, если района нет в справочнике
 *  или он — просто строка без описания. null = «текста нет, страница соберёт
 *  абзац только из живых данных». */
export function getMicrodistrictBlurb(city: string, name: string): string | null {
    const found = getMicrodistricts(city).find((entry) => microdistrictName(entry) === name);
    return found && typeof found !== 'string' ? found.blurb : null;
}

export function isMicrodistrictForCity(city: string, value: string): boolean {
    return getCanonicalMicrodistrict(city, value) !== null;
}
