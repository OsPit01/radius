// Скрипт генерации справочника станций Минского метрополитена из OpenStreetMap (Overpass API).
// Запуск: npx tsx scripts/import-metro.ts
// Пишет src/lib/constants/minsk-metro.ts — файл можно перегенерировать, когда откроют новые станции.
// Данные © участники OpenStreetMap, лицензия ODbL: https://www.openstreetmap.org/copyright

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
// Рамка Минска: «юг,запад,север,восток».
const MINSK_BBOX = '53.78,27.30,54.05,27.85';
// Вход дальше этого от всех станций считаем чужим (например, переход, не относящийся к метро).
const MAX_ENTRANCE_DISTANCE_M = 400;

type OsmElement = { lat: number; lon: number; tags?: Record<string, string> };

async function overpass(query: string): Promise<OsmElement[]> {
    for (let attempt = 1; attempt <= 4; attempt++) {
        const res = await fetch(OVERPASS_URL, {
            method: 'POST',
            headers: { 'User-Agent': 'radius-metro-import/1.0' },
            body: 'data=' + encodeURIComponent(query),
        });
        // 429 — лимит запросов, 502/504 — перегрузка сервера: повторяем с паузой
        if ([429, 502, 503, 504].includes(res.status)) {
            const wait = attempt * 5000;
            console.error(`  ⚠ Overpass: HTTP ${res.status}, повтор через ${wait / 1000}с`);
            await new Promise((r) => setTimeout(r, wait));
            continue;
        }
        if (!res.ok) {
            throw new Error(`Overpass: HTTP ${res.status}`);
        }
        return ((await res.json()) as { elements: OsmElement[] }).elements;
    }
    throw new Error('Overpass: не удалось получить данные после повторов');
}

// ===== Транслитерация названия в английский id: «Площадь Якуба Коласа» → «ploshchad-yakuba-kolasa» =====
const TRANSLIT: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
};

function toId(name: string): string {
    return [...name.toLowerCase()]
        .map((ch) => TRANSLIT[ch] ?? ch)
        .join('')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function distanceMeters(a: [number, number], b: [number, number]): number {
    const R = 6_371_000;
    const [lat1, lon1] = a.map((v) => (v * Math.PI) / 180) as [number, number];
    const [lat2, lon2] = b.map((v) => (v * Math.PI) / 180) as [number, number];
    const h = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

const round5 = (value: number) => Math.round(value * 1e5) / 1e5;
const ruName = (el: OsmElement) => el.tags?.['name:ru'] ?? el.tags?.name ?? '';

async function main() {
    console.log('→ станции метро Минска (OpenStreetMap)');
    // Только узлы «station» — у станций ещё есть платформы («stop»), они нам не нужны.
    const stationNodes = (
        await overpass(
            `[out:json][timeout:90];node["railway"="station"]["station"="subway"](${MINSK_BBOX});out tags center;`,
        )
    ).filter((el) => ruName(el) !== '');

    // На одну станцию в OSM может быть несколько узлов — берём первый.
    const byName = new Map<string, OsmElement>();
    for (const el of stationNodes) {
        byName.set(ruName(el), byName.get(ruName(el)) ?? el);
    }

    await new Promise((r) => setTimeout(r, 2500)); // Overpass разрешает ~1-2 запроса/сек
    console.log('→ входы в метро');
    const entranceNodes = await overpass(
        `[out:json][timeout:90];node["railway"="subway_entrance"](${MINSK_BBOX});out tags center;`,
    );

    const stations = [...byName.entries()].map(([name, el]) => {
        const ref = el.tags?.ref ?? '';
        return {
            id: toId(name),
            name,
            ref,
            latitude: round5(el.lat),
            longitude: round5(el.lon),
            entrances: [] as Array<[number, number]>,
        };
    });

    // Вход привязываем к станции по названию («Октябрьская/Купаловская» — к обеим), а если названия нет — к ближайшей.
    let orphan = 0;
    for (const entrance of entranceNodes) {
        const point: [number, number] = [entrance.lat, entrance.lon];
        const named = ruName(entrance)
            .split('/')
            .map((part) => stations.find((s) => s.name === part.trim()))
            .filter((s): s is (typeof stations)[number] => Boolean(s));

        if (named.length > 0) {
            for (const station of named) {
                station.entrances.push([round5(point[0]), round5(point[1])]);
            }
            continue;
        }
        const nearest = stations
            .map((s) => ({ s, d: distanceMeters(point, [s.latitude, s.longitude]) }))
            .sort((a, b) => a.d - b.d)[0];
        if (nearest && nearest.d <= MAX_ENTRANCE_DISTANCE_M) {
            nearest.s.entrances.push([round5(point[0]), round5(point[1])]);
        } else {
            orphan++;
        }
    }

    stations.sort((a, b) => a.ref.localeCompare(b.ref));

    const ids = new Set(stations.map((s) => s.id));
    if (ids.size !== stations.length) {
        throw new Error('Совпали id станций — нужна ручная правка транслитерации');
    }

    const body = stations
        .map((s) => {
            // Если у станции не нашлось ни одного входа, считаем по самой станции (см. findNearestMetro).
            const entrances = s.entrances.map(([lat, lon]) => `[${lat}, ${lon}]`).join(', ');
            return `    { id: '${s.id}', name: '${s.name}', latitude: ${s.latitude}, longitude: ${s.longitude}, entrances: [${entrances}] },`;
        })
        .join('\n');

    const file = `// Справочник станций Минского метрополитена.
// СГЕНЕРИРОВАНО скриптом scripts/import-metro.ts — руками не правим, перегенерируем: npx tsx scripts/import-metro.ts
// Данные © участники OpenStreetMap, лицензия ODbL: https://www.openstreetmap.org/copyright

export type MetroLine = 1 | 2 | 3;

export type MetroStation = {
    /** Английский id: «nemiga», «ploshchad-yakuba-kolasa». Его храним в базе. */
    id: string;
    /** Название на русском */
    name: string;
    /** 1 — Московская, 2 — Автозаводская, 3 — Зеленолужская */
    line: MetroLine;
    /** Точка самой станции */
    latitude: number;
    longitude: number;
    /** Входы «[широта, долгота]»: пешком идут именно до них, а не до середины станции */
    entrances: Array<[number, number]>;
};

// Одна станция на строку: так файл остаётся компактным и не раздувается при форматировании.
// prettier-ignore
export const MINSK_METRO_STATIONS: readonly MetroStation[] = [
${body}
];
`;

    const target = fileURLToPath(new URL('../src/lib/constants/minsk-metro.ts', import.meta.url));
    writeFileSync(target, file, 'utf-8');
    const entranceCount = stations.reduce((sum, s) => sum + s.entrances.length, 0);
    console.log(`✅ ${stations.length} станций, ${entranceCount} входов (без станции: ${orphan}) → ${target}`);
    for (const s of stations) {
        console.log(`   ${s.ref.padEnd(4)} ${s.id.padEnd(34)} ${s.name}  (входов: ${s.entrances.length})`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
