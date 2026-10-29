import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { env } from '@/env';
import { createKeyRotation } from '@/server/yandex-keys';

/**
 * Геосаджест Яндекса — подсказки адреса, пока человек печатает. В отличие от геокодера он понимает
 * недописанные слова («Притыцк», «Ленин»). Координат в подсказке нет: по выбранному дому геокодер
 * отдаёт все данные адреса (см. `resolveAddressByUri` в yandex-geocoder.ts).
 */
const SUGGEST_URL = 'https://suggest-maps.yandex.ru/v1/suggest';
const MAX_HINTS = 10;

// Что подсказываем: дом, улица, населённый пункт, район, область. Организации, метро, реки, парки и т.п. не нужны.
const HINT_TYPES = 'house,street,locality,district,area,province';
// Теги из ответа, которые считаем адресом или местом. У района области («Минский район») тег `area`, но под тем же тегом
// приходят и сельсоветы («Ленинский сельсовет») — их отсеиваем по названию.
const ADDRESS_TAGS = new Set(['house', 'street', 'locality', 'district', 'province']);
const REGION_DISTRICT_NAME = /район$/i;

export type AddressHint = {
    /** Главная строка: «улица Немига, 5» */
    label: string;
    /** Где это: «Минск». Может быть пустым. */
    description: string;
    /**
     * Что подставить в поле, если эту подсказку выбрали, а адрес ещё не закончен (улица, город…):
     * «улица Ленина, Минск, ». Человек дописывает дом, и Яндекс подсказывает дома этой улицы.
     */
    text: string;
    /** Идентификатор для геокодера. Есть только у законченного адреса. */
    uri: string | null;
    /** Дом: адрес закончен, по `uri` можно получить все данные. Остальное (улица, город…) — шаг к дому. */
    final: boolean;
};

// Описываем только те поля ответа, которые реально используем. results может отсутствовать, если ничего не нашлось.
const suggestResponseSchema = z.object({
    results: z
        .array(
            z.object({
                title: z.object({ text: z.string() }),
                subtitle: z.object({ text: z.string() }).optional(),
                tags: z.array(z.string()).optional(),
                uri: z.string().optional(),
            }),
        )
        .optional(),
});

// «ГСК Лада-Заславль», «СТ Белые Росы», «ЖК Боровляны-2»: настоящее название не начинается с заглавной аббревиатуры.
const ABBREVIATION_NAME = /^[А-ЯЁ]{2,}(?=\s)/u;
// «садоводческое товарищество Свислочь», «гаражный кооператив …» — не место для аренды.
const NON_RESIDENTIAL_NAME = /садовод|дачн|гараж|огородн|коттедж|кооператив|товарищест/iu;

const fetchWithKeys = createKeyRotation({
    name: 'geosuggest',
    getKeys: () => [env.YANDEX_GEOSUGGEST_API_KEY, env.YANDEX_GEOSUGGEST_API_KEY_RESERVE],
});

export async function suggestAddresses(query: string): Promise<AddressHint[]> {
    const res = await fetchWithKeys((apiKey) => {
        const url = new URL(SUGGEST_URL);
        url.search = new URLSearchParams({
            apikey: apiKey,
            text: query,
            lang: 'ru',
            results: String(MAX_HINTS),
            types: HINT_TYPES,
            // Только Беларусь: без рамок и ручного отсева, как приходилось делать с геокодером.
            countries: 'by',
            attrs: 'uri',
            highlight: '0',
        }).toString();
        return url;
    });

    const parsed = suggestResponseSchema.safeParse(await res.json());
    if (!parsed.success) {
        console.error('[yandex-geosuggest] неожиданный формат ответа');
        throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Поиск адреса временно недоступен' });
    }

    const hints = new Map<string, AddressHint>();
    for (const item of parsed.data.results ?? []) {
        const tags = item.tags ?? [];
        const label = item.title.text;
        const isHouse = tags.includes('house');

        const isRegionDistrict = tags.includes('area') && REGION_DISTRICT_NAME.test(label);

        if (
            !(tags.some((tag) => ADDRESS_TAGS.has(tag)) || isRegionDistrict) ||
            ABBREVIATION_NAME.test(label) ||
            NON_RESIDENTIAL_NAME.test(label)
        ) {
            continue;
        }
        // Дом без идентификатора довести до адреса нечем.
        if (isHouse && !item.uri) {
            continue;
        }

        const description = item.subtitle?.text ?? '';
        hints.set(`${label}|${description}`, {
            label,
            description,
            text: `${[label, description].filter(Boolean).join(', ')}, `,
            uri: isHouse ? (item.uri ?? null) : null,
            final: isHouse,
        });
    }
    return [...hints.values()];
}
