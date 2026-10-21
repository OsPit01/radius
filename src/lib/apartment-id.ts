// src/lib/apartment-id.ts

/**
 * Превращает сегмент URL (/apartments/[id]) в корректный положительный id.
 * Возвращает null, если в URL мусор ("abc", "1.5", пусто, "-3").
 *
 * Зачем: Number("abc") даёт NaN, и zod падает с 500-ошибкой.
 * Читатель url обязан проверить значение ДО запроса в БД.
 */
export function parseApartmentId(raw: string | string[] | undefined): number | null {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) {
        return null;
    }
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}
