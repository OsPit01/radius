// src/lib/constants/catalog.ts
//
// ===== КАТАЛОГ SEO-СТРАНИЦ: ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ ДЛЯ АДРЕСОВ =====
//
// Схема адреса (карта сайта «urls»):
//
//   /{сделка}/{тип жилья}/{город}/{вид района}/{район}
//   /rent    /flat       /minsk   /microdistrict /newbor
//
// Каждый уровень — «enum»: объект `as const` + одноимённый union-тип
// (так в проекте принято вместо ключевого слова `enum`).
// Значение enum'а — это сегмент URL, поэтому имена папок в src/pages/rent/...
// ДОЛЖНЫ совпадать со значениями ниже.
//
// Как добавить страницу:
//   • новый микрорайон — одна строка в MicrodistrictSlug и одна запись в MICRODISTRICTS
//     (TypeScript не даст забыть запись: реестр типизирован как Record<MicrodistrictSlug, …>);
//   • новый город / тип жилья / сделка — значение в нужном enum'е (+ запись в реестре, если он есть)
//     и папка в src/pages/...;
//   • новый вид района (метро, административный район) — значение в AreaKindSlug,
//     свой enum и реестр по образцу микрорайонов, и папка `[slug].tsx` рядом с microdistrict/.

// ===== ENUM'Ы УРОВНЕЙ URL =====

/** Сделка: /rent. Продажа (/buy) появится позже. */
export const DealSlug = {
    Rent: 'rent',
} as const;
export type DealSlug = (typeof DealSlug)[keyof typeof DealSlug];

/** Тип жилья: /flat. Дома (/house) появятся позже. */
export const PropertySlug = {
    Flat: 'flat',
} as const;
export type PropertySlug = (typeof PropertySlug)[keyof typeof PropertySlug];

/** Город: /minsk. Брест и Бобруйск появятся позже. */
export const CitySlug = {
    Minsk: 'minsk',
} as const;
export type CitySlug = (typeof CitySlug)[keyof typeof CitySlug];

/** Вид района внутри города: /microdistrict. Метро (/metro) и районы (/district) появятся позже. */
export const AreaKindSlug = {
    Microdistrict: 'microdistrict',
} as const;
export type AreaKindSlug = (typeof AreaKindSlug)[keyof typeof AreaKindSlug];

/** Микрорайоны (/microdistrict/{slug}). */
export const MicrodistrictSlug = {
    Newbor: 'newbor',
    MayakMinsk: 'mayak-minsk',
    Grushevka: 'grushevka',
} as const;

export type MicrodistrictSlug = (typeof MicrodistrictSlug)[keyof typeof MicrodistrictSlug];

// ===== РЕЕСТРЫ (названия и связь с данными) =====

type CityConfig = {
    /** Как показываем людям: «Минск». */
    label: string;
    /** Родительный падеж для заголовков вида «Районы Минска». */
    genitive: string;
    /** Как город записан в БД (apartments.city). */
    dbName: string;
};

export const CITIES = {
    [CitySlug.Minsk]: { label: 'Минск', genitive: 'Минска', dbName: 'Минск' },
} satisfies Record<CitySlug, CityConfig>;

type MicrodistrictConfig = {
    city: CitySlug;
    /** Как показываем людям (плитки, заголовки, title). */
    label: string;
    /**
     * Название после «в» для подписи плитки на главной: «Квартиры на сутки в …».
     * Склоняем руками (в SEO-заголовках страницы микрорайона названия не склоняем, см. catalog-seo.ts).
     */
    locative: string;
    /**
     * Как микрорайон записан в БД (apartments.microdistrict).
     * Поле свободное — владелец вводит его руками, поэтому сравниваем без учёта регистра
     * («Новая боровая» в БД == «Новая Боровая» здесь). БД не меняем.
     */
    dbName: string;
};

export const MICRODISTRICTS = {
    [MicrodistrictSlug.Newbor]: {
        city: CitySlug.Minsk,
        label: 'Новая Боровая',
        locative: 'Новой Боровой',
        dbName: 'Новая Боровая',
    },
    [MicrodistrictSlug.Grushevka]: {
        city: CitySlug.Minsk,
        label: 'Грушевка',
        locative: 'Грушевке',
        dbName: 'Грушевка',
    },
    [MicrodistrictSlug.MayakMinsk]: {
        city: CitySlug.Minsk,
        label: 'Маяк Минск',
        // Неразрывный пробел: иначе в узкой плитке название рвётся на «Маяк» / «Минск».
        locative: 'Маяк\u00a0Минск',
        dbName: 'Маяк Минск',
    },
} satisfies Record<MicrodistrictSlug, MicrodistrictConfig>;

// ===== ПОИСК ПО РЕЕСТРУ =====

export const MICRODISTRICT_SLUGS: readonly MicrodistrictSlug[] = Object.values(MicrodistrictSlug);

/** Микрорайоны города — в порядке объявления в enum'е (так же идут плитки на главной). */
export function getMicrodistrictSlugsByCity(city: CitySlug): MicrodistrictSlug[] {
    return MICRODISTRICT_SLUGS.filter((slug) => MICRODISTRICTS[slug].city === city);
}

export function isMicrodistrictSlug(value: string): value is MicrodistrictSlug {
    return (MICRODISTRICT_SLUGS as readonly string[]).includes(value);
}

const normalizeName = (value: string) => value.trim().toLowerCase();

/**
 * Находит микрорайон по названию (как в БД или как на сайте), без учёта регистра.
 * Если передан `city` — ещё и проверяет, что микрорайон принадлежит этому городу.
 */
export function findMicrodistrictSlug(name: string | null | undefined, city?: string): MicrodistrictSlug | undefined {
    if (!name) {
        return undefined;
    }
    const wanted = normalizeName(name);
    return MICRODISTRICT_SLUGS.find((slug) => {
        const config = MICRODISTRICTS[slug];
        const nameMatches = normalizeName(config.dbName) === wanted || normalizeName(config.label) === wanted;
        const cityMatches = city === undefined || normalizeName(CITIES[config.city].dbName) === normalizeName(city);
        return nameMatches && cityMatches;
    });
}

// ===== ПОСТРОЕНИЕ АДРЕСОВ =====

type CatalogPathSegments = {
    deal: DealSlug;
    property: PropertySlug;
    city: CitySlug;
    areaKind: AreaKindSlug;
    area: string;
};

/** /rent/flat/minsk/microdistrict/newbor */
export function buildCatalogPath({ deal, property, city, areaKind, area }: CatalogPathSegments): string {
    return `/${deal}/${property}/${city}/${areaKind}/${area}`;
}

export function getMicrodistrictPath(slug: MicrodistrictSlug): string {
    return buildCatalogPath({
        deal: DealSlug.Rent,
        property: PropertySlug.Flat,
        city: MICRODISTRICTS[slug].city,
        areaKind: AreaKindSlug.Microdistrict,
        area: slug,
    });
}
