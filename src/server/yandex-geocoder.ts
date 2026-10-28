import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { env } from '@/env';
import { BELARUS_REGIONS, getCityDistricts } from '@/lib/constants/belarus-locations';
import { createKeyRotation } from '@/server/yandex-keys';

/**
 * Геокодер Яндекса. В форме добавления объекта у него три задачи (подсказки при вводе даёт Геосаджест, см. yandex-geosuggest.ts):
 *  1. `resolveAddressByUri` — по выбранной подсказке отдать все данные адреса и координаты (1 запрос);
 *  2. `searchAddresses` — найти координаты адреса, введённого вручную;
 *  3. `findCityDistrict` — район города для Минска и областных центров (внутри п. 1).
 */
const GEOCODER_URL = 'https://geocode-maps.yandex.ru/1.x/';
// Просим больше, чем нужно: часть ответов (метро, «примерные» дома, дороги, чужие страны) отсеивается.
const REQUESTED_RESULTS = 12;

// Рамка Беларуси «lon,lat~lon,lat» + rspn=1 сужают поиск, а точный отсев по стране — ниже (country_code).
const BELARUS_BBOX = '23.1,56.2~32.8,51.2';

export type AddressSuggestion = {
    /** Как показать в списке: «улица Немига, 5» */
    label: string;
    /** Где это: «Минск» или «деревня Ленинский, Новопольский сельсовет, Пуховичский район, Минская область» */
    description: string;
    /** Улица в том же виде, что в справочнике улиц: «улица Немига» */
    street: string;
    /** Номер дома вместе с корпусом, как пишет Яндекс: «5», «156к1», «2А». Пусто, если нашлась только улица */
    house: string;
    /**
     * Область — `value` из BELARUS_REGIONS: «minsk-region», «grodno-region»… Минск относится к Минской области.
     * Пусто, если область определить не удалось: форма тогда даёт выбрать одну из шести.
     */
    region: string;
    /**
     * Административный район: «Минский район». У Минска и областных центров это район города («Центральный»);
     * пусто у «городов областного подчинения» и если район города определить не удалось.
     */
    district: string;
    /** Населённый пункт без типа: «Боровляны» (в таком же написании, как в справочнике, если он там есть) */
    city: string;
    lat: number;
    lon: number;
};

// Описываем только те поля ответа, которые реально используем.
const geocoderResponseSchema = z.object({
    response: z.object({
        GeoObjectCollection: z.object({
            featureMember: z.array(
                z.object({
                    GeoObject: z.object({
                        name: z.string(),
                        description: z.string().optional(),
                        Point: z.object({ pos: z.string() }),
                        metaDataProperty: z.object({
                            GeocoderMetaData: z.object({
                                kind: z.string(),
                                precision: z.string(),
                                Address: z.object({
                                    country_code: z.string().optional(),
                                    Components: z.array(z.object({ kind: z.string(), name: z.string() })),
                                }),
                            }),
                        }),
                    }),
                }),
            ),
        }),
    }),
});

type Component = { kind: string; name: string };
type GeoObject = z.infer<
    typeof geocoderResponseSchema
>['response']['GeoObjectCollection']['featureMember'][number]['GeoObject'];

const normalize = (value: string) => value.toLowerCase().replaceAll('ё', 'е').trim();

/**
 * Яндекс отдаёт населённый пункт с типом: «деревня Ленинский», «посёлок городского типа Руба».
 * Тип всегда с маленькой буквы, название — с большой (города приходят без типа: «Заславль»).
 */
function stripLocalityType(locality: string): string {
    const stripped = locality.replace(/^(?:\p{Ll}+\s+)+(?=[\p{Lu}\d])/u, '');
    return stripped || locality;
}

type Location = Pick<AddressSuggestion, 'region' | 'district' | 'city'>;

/**
 * Превращает компоненты адреса Яндекса в область/район/город нашего справочника.
 * Возвращает null, только если населённого пункта нет. Область может остаться пустой — тогда её выберет человек.
 */
export function resolveLocation(components: Component[]): Location | null {
    const find = (kind: string) => components.find((c) => c.kind === kind)?.name;

    const locality = find('locality');
    if (!locality) {
        return null;
    }
    const city = stripLocalityType(locality);

    // Минск и областные центры: Яндекс отдаёт их без типа («Гродно»). Область берём по самому городу — у Минска
    // province бывает «Минск», а не область, и по нему область не найти. Район города (не область!) определит
    // отдельный запрос (findCityDistrict), поэтому здесь он пустой.
    const center = BELARUS_REGIONS.find((r) => normalize(r.center.name) === normalize(city));
    if (center) {
        return { region: center.value, district: '', city: center.center.name };
    }

    // area приходит и районом («Минский район»), и сельсоветом, и «городом областного подчинения» — нужен только район.
    const areaName = components.find((c) => c.kind === 'area' && /район$/i.test(c.name))?.name;

    // Область: сначала то, что назвал Яндекс (province: «Гродненская область»), затем область, в которой есть такой район.
    // Ничего не нашлось — оставляем пустой, адрес при этом не отбрасываем.
    const province = find('province');
    const region =
        BELARUS_REGIONS.find((r) => province && normalize(r.label) === normalize(province)) ??
        BELARUS_REGIONS.find((r) => areaName && r.districts.some((d) => normalize(d.name) === normalize(areaName)));

    const district = region?.districts.find((d) => areaName && normalize(d.name) === normalize(areaName));
    const knownCity = district?.localities.find((l) => normalize(l.name) === normalize(city));

    return { region: region?.value ?? '', district: district?.name ?? areaName ?? '', city: knownCity?.name ?? city };
}

/** «27.549955 53.902321» (lon lat) → { lat, lon } */
function parsePoint(pos: string): { lat: number; lon: number } | null {
    const [lon, lat] = pos.split(' ').map(Number);
    if (lon === undefined || lat === undefined || !Number.isFinite(lon) || !Number.isFinite(lat)) {
        return null;
    }
    return { lat, lon };
}

const fetchWithKeys = createKeyRotation({
    name: 'geocoder',
    getKeys: () => [env.YANDEX_GEOCODER_API_KEY, env.YANDEX_GEOCODER_API_KEY_RESERVE],
});

/** Один запрос к геокодеру (с переходом на резервный ключ, если основной отказал). */
async function requestGeocoder(params: Record<string, string>) {
    const res = await fetchWithKeys((apiKey) => {
        const url = new URL(GEOCODER_URL);
        url.search = new URLSearchParams({ apikey: apiKey, format: 'json', lang: 'ru_RU', ...params }).toString();
        return url;
    });

    const parsed = geocoderResponseSchema.safeParse(await res.json());
    if (!parsed.success) {
        console.error('[yandex-geocoder] неожиданный формат ответа');
        throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Поиск адреса временно недоступен' });
    }

    return parsed.data.response.GeoObjectCollection.featureMember.map((m) => m.GeoObject);
}

/**
 * Дом или улица в Беларуси с населённым пунктом, областью и точкой — в виде, готовом для формы.
 * null — объект не подходит: другая страна, метро, дорога вне населённого пункта (Р-65), «примерный» дом (near/range).
 */
function toSuggestion(geoObject: GeoObject): AddressSuggestion | null {
    const { kind, precision, Address } = geoObject.metaDataProperty.GeocoderMetaData;
    const component = (name: string) => Address.Components.find((c) => c.kind === name)?.name;

    // bbox захватывает куски соседних стран — оставляем только Беларусь.
    if (Address.country_code !== 'BY') {
        return null;
    }
    const street = component('street');
    const exactHouse = kind === 'house' && (precision === 'exact' || precision === 'number');
    if (!street || !(exactHouse || kind === 'street')) {
        return null;
    }
    const location = resolveLocation(Address.Components);
    const point = parsePoint(geoObject.Point.pos);
    if (!location || !point) {
        return null;
    }

    // Номер дома у улицы без дома пустой; «примерные» дома мы уже отбросили выше.
    const house = exactHouse ? (component('house') ?? '') : '';

    return {
        label: geoObject.name,
        // «Минск, Беларусь» → «Минск», но у самого Минска или области описание — просто «Беларусь», его оставляем.
        description: (geoObject.description ?? '').replace(/,\s*Беларусь$/u, ''),
        street,
        house,
        ...location,
        ...point,
    };
}

/**
 * Район города («Центральный») для Минска и областных центров. Прямой запрос его не отдаёт,
 * поэтому спрашиваем геокодер, какому району принадлежит точка. null — не определился.
 */
async function findCityDistrict(latitude: number, longitude: number, cityName: string): Promise<string | null> {
    const cityDistricts = getCityDistricts(cityName);
    if (!cityDistricts) {
        return null;
    }

    // Для точки приходят и административный район («Центральный район»), и микрорайоны/кварталы — берём только район.
    const geoObjects = await requestGeocoder({ geocode: `${longitude},${latitude}`, kind: 'district', results: '10' });

    for (const { name } of geoObjects) {
        const match = cityDistricts.find((d) => normalize(`${d} район`) === normalize(name));
        if (match) {
            return match;
        }
    }
    return null;
}

/**
 * Все данные адреса по подсказке Геосаджеста: область, район, населённый пункт, улица, дом, корпус и координаты.
 * Это один запрос к геокодеру; у Минска и областных центров ещё один — за районом города (в подсказке его нет).
 * null — по этому идентификатору не нашёлся адрес в Беларуси.
 */
export async function resolveAddressByUri(uri: string): Promise<AddressSuggestion | null> {
    const [geoObject] = await requestGeocoder({ uri, results: '1' });
    const suggestion = geoObject ? toSuggestion(geoObject) : null;
    if (!suggestion) {
        return null;
    }

    if (!getCityDistricts(suggestion.city) || suggestion.district) {
        return suggestion;
    }

    // Район города не определился (или лимит) — адрес всё равно отдаём, район человек выберет сам.
    const district = await findCityDistrict(suggestion.lat, suggestion.lon, suggestion.city).catch(() => null);
    return district ? { ...suggestion, district } : suggestion;
}

/**
 * Ищет адрес по тексту — для адреса, введённого вручную (чтобы найти его координаты).
 * Подсказки при вводе делает Геосаджест: геокодер не автодополнение.
 */
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
    const geoObjects = await requestGeocoder({
        geocode: query,
        results: String(REQUESTED_RESULTS),
        bbox: BELARUS_BBOX,
        rspn: '1',
    });
    return geoObjects.map(toSuggestion).filter((suggestion): suggestion is AddressSuggestion => suggestion !== null);
}
