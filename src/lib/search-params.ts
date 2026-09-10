import { HOME_TITLE, HOME_DESCRIPTION } from "@/lib/seo";

// ===== ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ ДЛЯ URL-ФИЛЬТРОВ ПОИСКА =====
export type SearchFilters = {
  city?: string;
  guests?: number;
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  beds?: number;
  sofas?: number;
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

// ===== SEO-ЗАГОЛОВКИ ДЛЯ ОТФИЛЬТРОВАННЫХ СТРАНИЦ =====
function roomsWord(rooms: number): string {
  if (rooms === 1) return "1-комнатная";
  return `${rooms}-комнатные`;
}

export function buildSearchTitle(filters: SearchFilters): string {
  if (!filters.city && !filters.rooms && !filters.guests) return HOME_TITLE;
  const parts: string[] = [];
  if (filters.rooms) parts.push(roomsWord(filters.rooms));
  if (filters.city) parts.push(`в ${filters.city}`);
  const subject = parts.length > 0 ? `Квартиры на сутки ${parts.join(" ")}` : "Квартиры на сутки";
  if (filters.guests && filters.guests > 1) {
    return `${subject} — снять на сутки на ${filters.guests} человек | Radius`;
  }
  return `${subject} — снять на сутки | Radius`;
}

export function buildSearchDescription(filters: SearchFilters): string {
  if (!filters.city && !filters.rooms && !filters.guests) return HOME_DESCRIPTION;
  const parts: string[] = [];
  if (filters.rooms) parts.push(roomsWord(filters.rooms));
  if (filters.city) parts.push(filters.city);
  const subject =
    parts.length > 0 ? `Снять ${parts.join(" ")} квартиру на сутки` : "Снять квартиру на сутки";
  return `${subject}. Актуальные фото, честные цены, бронирование онлайн напрямую от собственников.`;
}