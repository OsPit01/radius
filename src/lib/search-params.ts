import { DEFAULT_BOOKING_GUESTS, MAX_BOOKING_GUESTS } from '@/lib/constants/booking';

// ===== ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ ДЛЯ URL-ФИЛЬТРОВ ПОИСКА =====
export type SearchFilters = {
    city?: string;
    guests?: number;
    children?: number;
    priceMin?: number;
    priceMax?: number;
    rooms?: number;
    beds?: number;
    sofas?: number;
    metro?: number;
};

function toPositiveInt(value: string | string[] | undefined): number | undefined {
    if (Array.isArray(value)) {
        value = value[0];
    }
    if (!value) {
        return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined;
}

export function parseSearchParams(searchParams: Record<string, string | string[] | undefined>): SearchFilters {
    return {
        city: typeof searchParams.city === 'string' ? searchParams.city.trim() || undefined : undefined,
        guests: toPositiveInt(searchParams.guests),
        children: toPositiveInt(searchParams.children),
        priceMin: toPositiveInt(searchParams.priceMin),
        priceMax: toPositiveInt(searchParams.priceMax),
        rooms: toPositiveInt(searchParams.rooms),
        beds: toPositiveInt(searchParams.beds),
        sofas: toPositiveInt(searchParams.sofas),
        metro: toPositiveInt(searchParams.metro),
    };
}

/**
 * Сколько гостей подставить в форму бронирования, пришедших из URL.
 * Разбор — единый (через parseSearchParams), здесь только политика:
 * мусор и нереальные значения обрезаются до допустимого диапазона,
 * а если гостей в URL нет — берётся значение по умолчанию.
 */
export function parseBookingGuests(searchParams: Record<string, string | string[] | undefined>): number {
    const guests = parseSearchParams(searchParams).guests;
    if (guests === undefined) {
        return DEFAULT_BOOKING_GUESTS;
    }
    return Math.min(guests, MAX_BOOKING_GUESTS);
}

/**
 * Сколько детей подставить в форму бронирования, пришедших из URL.
 * Если детей в URL нет — 0.
 */
export function parseBookingChildren(searchParams: Record<string, string | string[] | undefined>): number {
    const children = parseSearchParams(searchParams).children;
    if (children === undefined) {
        return 0;
    }
    return Math.min(children, MAX_BOOKING_GUESTS);
}
