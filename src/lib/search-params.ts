import { HOME_TITLE, HOME_DESCRIPTION } from "@/lib/seo";
import {
  DEFAULT_BOOKING_GUESTS,
  MAX_BOOKING_GUESTS,
} from "@/lib/constants/booking";

// ===== ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ ДЛЯ URL-ФИЛЬТРОВ ПОИСКА =====
export type SearchFilters = {
  city?: string;
  guests?: number;
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  beds?: number;
  sofas?: number;
  metro?: number;
};

// Фиксированный порядок ключей в строке запроса:
// делает URL стабильным и защищает от дублей (?rooms=2&city=X === ?city=X&rooms=2)
const QUERY_KEY_ORDER = [
  "city",
  "guests",
  "priceMin",
  "priceMax",
  "rooms",
  "beds",
  "sofas",
  "metro",
] as const;

function toPositiveInt(value: string | string[] | undefined): number | undefined {
  if (Array.isArray(value)) value = value[0];
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined;
}

export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): SearchFilters {
  return {
    city:
      typeof searchParams.city === "string"
        ? searchParams.city.trim() || undefined
        : undefined,
    guests: toPositiveInt(searchParams.guests),
    priceMin: toPositiveInt(searchParams.priceMin),
    priceMax: toPositiveInt(searchParams.priceMax),
    rooms: toPositiveInt(searchParams.rooms),
    beds: toPositiveInt(searchParams.beds),
    sofas: toPositiveInt(searchParams.sofas),
    metro: toPositiveInt(searchParams.metro),
  };
}

export function buildQueryString(filters: SearchFilters): string {
  const params = new URLSearchParams();
  for (const key of QUERY_KEY_ORDER) {
    const value = filters[key];
    if (value === undefined || value === "" || value === null) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export function buildSearchUrl(filters: SearchFilters): string {
  const qs = buildQueryString(filters);
  return qs ? `/?${qs}` : "/";
}

/**
 * Сколько гостей подставить в форму бронирования, пришедших из URL.
 * Разбор — единый (через parseSearchParams), здесь только политика:
 * мусор и нереальные значения обрезаются до допустимого диапазона,
 * а если гостей в URL нет — берётся значение по умолчанию.
 */
export function parseBookingGuests(
  searchParams: Record<string, string | string[] | undefined>,
): number {
  const guests = parseSearchParams(searchParams).guests;
  if (guests === undefined) return DEFAULT_BOOKING_GUESTS;
  return Math.min(guests, MAX_BOOKING_GUESTS);
}

// ===== SEO-ЗАГОЛОВКИ ДЛЯ ОТФИЛЬТРОВАННЫХ СТРАНИЦ =====
export function buildSearchTitle(filters: SearchFilters): string {
  if (!filters.city && !filters.rooms && !filters.guests) return HOME_TITLE;

  const subject = filters.rooms
    ? filters.rooms === 1
      ? "1-комнатная квартира на сутки"
      : `${filters.rooms}-комнатные квартиры на сутки`
    : "Квартиры на сутки";

  const withCity = filters.city ? `${subject} в ${filters.city}` : subject;

  if (filters.guests && filters.guests > 1) {
    return `${withCity} — снять на сутки на ${filters.guests} человек | Radius`;
  }
  return `${withCity} — снять на сутки | Radius`;
}

export function buildSearchDescription(filters: SearchFilters): string {
  if (!filters.city && !filters.rooms && !filters.guests) return HOME_DESCRIPTION;

  const subject = filters.rooms
    ? filters.rooms === 1
      ? "Снять 1-комнатную квартиру"
      : `Снять ${filters.rooms}-комнатные квартиры`
    : "Снять квартиру";

  const withCity = filters.city ? `${subject} в ${filters.city}` : subject;

  return `${withCity} на сутки. Актуальные фото, честные цены, бронирование онлайн напрямую от собственников.`;
}