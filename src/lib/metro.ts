import { type MetroStation, MINSK_METRO_STATIONS } from '@/lib/constants/minsk-metro';
import { isMetroWalkable } from '@/lib/metro-limit';

/**
 * По прямой до входа метро пешком идти дольше: дома, дворы, переходы. Сверили с пешеходной маршрутизацией по
 * OpenStreetMap на 15 точках Минска: путь в 1,02–1,58 раза длиннее прямой, в среднем 1,25. Берём 1,3 и округляем минуты
 * вверх — оценка чуть завышает (в пределах пары минут), и это безопаснее, чем обещать гостю лишнее.
 * Это оценка, а не маршрут
 */
const WALK_DETOUR_FACTOR = 1.3;
/** Обычный шаг пешехода: ~4,8 км/ч. */
const WALK_METERS_PER_MINUTE = 80;

/** Области справочника (value из BELARUS_REGIONS), где ищем ближайшую станцию: Минская область — вместе с самим Минском. */
const METRO_REGIONS = new Set(['minsk-region']);

export function isMetroRegion(regionValue: string): boolean {
    return METRO_REGIONS.has(regionValue);
}

export type NearestMetro = {
    station: MetroStation;
    /** Расстояние по прямой до ближайшего входа, м */
    distanceMeters: number;
    /** Оценка времени пешком, минут (округляется вверх, не меньше 1) */
    walkMinutes: number;
};

/** Расстояние по прямой между двумя точками, м (формула гаверсинусов). */
export function distanceMeters(latA: number, lonA: number, latB: number, lonB: number): number {
    const earthRadius = 6_371_000;
    const toRad = (degrees: number) => (degrees * Math.PI) / 180;
    const dLat = toRad(latB - latA);
    const dLon = toRad(lonB - lonA);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLon / 2) ** 2;
    return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

/** Время пешком по расстоянию по прямой, мин: с поправкой на дорогу, округление вверх. */
export function walkMinutesFor(straightLineMeters: number): number {
    return Math.max(1, Math.ceil((straightLineMeters * WALK_DETOUR_FACTOR) / WALK_METERS_PER_MINUTE));
}

/** Расстояние по прямой от точки до станции, м. Считаем до входов (идут именно туда), а если входы не нашлись — до самой станции. */
function distanceToStation(station: MetroStation, latitude: number, longitude: number): number {
    const points: Array<[number, number]> =
        station.entrances.length > 0 ? station.entrances : [[station.latitude, station.longitude]];
    return Math.min(...points.map(([lat, lon]) => distanceMeters(latitude, longitude, lat, lon)));
}

/**
 * Ближайшая станция метро Минска к точке и оценка пути пешком.
 * null — до метро METRO_WALK_LIMIT_MINUTES пешком и больше: такое метро мы не показываем.
 */
export function findNearestMetro(latitude: number, longitude: number): NearestMetro | null {
    let best: { station: MetroStation; meters: number } | null = null;

    for (const station of MINSK_METRO_STATIONS) {
        const meters = distanceToStation(station, latitude, longitude);
        if (!best || meters < best.meters) {
            best = { station, meters };
        }
    }

    if (!best) {
        return null;
    }
    const walkMinutes = walkMinutesFor(best.meters);
    if (!isMetroWalkable(walkMinutes)) {
        return null;
    }
    return { station: best.station, distanceMeters: Math.round(best.meters), walkMinutes };
}

/**
 * Время пешком до станции, которую выбрали вручную, мин. Порога METRO_WALK_LIMIT_MINUTES здесь нет — он нужен только для
 * автоподбора ближайшей, а вручную можно выбрать любую; решает вызывающий. null — такой станции нет в справочнике.
 */
export function walkMinutesToStation(stationId: string, latitude: number, longitude: number): number | null {
    const station = getMetroStation(stationId);
    return station ? walkMinutesFor(distanceToStation(station, latitude, longitude)) : null;
}

export function getMetroStation(id: string | undefined): MetroStation | undefined {
    return id ? MINSK_METRO_STATIONS.find((station) => station.id === id) : undefined;
}

/** Все станции по алфавиту — для выпадающего списка (в справочнике они идут по линиям). */
export const METRO_STATIONS_ALPHABETICAL: readonly MetroStation[] = [...MINSK_METRO_STATIONS].sort((a, b) =>
    a.name.localeCompare(b.name, 'ru'),
);
