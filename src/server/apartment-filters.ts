import { and, eq, gt, gte, ilike, lte, or, type SQL, sql } from 'drizzle-orm';
import { z } from 'zod';

import { hideTestApartments } from '@/server/apartment-selects';
import { apartments } from '@/server/db/schemas';

/**
 * Фильтры каталога — схема ввода для apartment.getAll.
 * Вынесены вместе со сборкой SQL-условий, чтобы роутер не раздувался.
 */
export const catalogFiltersSchema = z.object({
    // Свободный поиск: город, улица или микрорайон содержит строку.
    city: z.string().trim().min(1).optional(),
    // Точное название города (apartments.city) — для страниц каталога /rent/flat/{город}/...
    exactCity: z.string().trim().min(1).optional(),
    // Точное название микрорайона, без учёта регистра: в БД оно набрано руками
    // («Новая боровая»), а на сайте пишется «Новая Боровая».
    microdistrict: z.string().trim().min(1).optional(),
    // Область (region value, например 'vitebsk-region') — для страниц областей
    // каталога /rent/flat/{область}: все квартиры области, включая её центр.
    region: z.string().trim().min(1).optional(),
    guests: z.number().int().min(1).optional(),
    priceMin: z.number().int().min(0).optional(),
    priceMax: z.number().int().min(0).optional(),
    rooms: z.number().int().min(1).optional(),
    beds: z.number().int().min(1).optional(),
    sofas: z.number().int().min(1).optional(),
    metro: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
});

export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;

/**
 * Входные фильтры → список SQL-условий для WHERE каталога.
 * role нужна, чтобы спрятать тестовые объекты от всех, кроме суперадмина.
 */
export function buildCatalogConditions(input: CatalogFilters | undefined, role?: string): (SQL | undefined)[] {
    const conditions: (SQL | undefined)[] = [eq(apartments.status, 'active'), hideTestApartments(role)];

    if (input?.city) {
        conditions.push(
            or(
                ilike(apartments.city, `%${input.city}%`),
                ilike(apartments.street, `%${input.city}%`),
                ilike(apartments.microdistrict, `%${input.city}%`),
            ),
        );
    }
    if (input?.exactCity) {
        conditions.push(eq(apartments.city, input.exactCity));
    }
    if (input?.microdistrict) {
        conditions.push(sql`lower(trim(${apartments.microdistrict})) = lower(${input.microdistrict})`);
    }
    if (input?.region) {
        conditions.push(eq(apartments.region, input.region));
    }
    if (input?.guests && input.guests > 1) {
        conditions.push(gte(apartments.capacity, input.guests));
    }
    if (input?.priceMin) {
        conditions.push(gte(apartments.price, input.priceMin));
    }
    if (input?.priceMax) {
        conditions.push(lte(apartments.price, input.priceMax));
    }
    if (input?.rooms) {
        // 4 = "4+", всё что от 4 и больше
        if (input.rooms >= 4) {
            conditions.push(gte(apartments.rooms, input.rooms));
        } else {
            conditions.push(eq(apartments.rooms, input.rooms));
        }
    }
    if (input?.beds) {
        conditions.push(gte(sql`${apartments.beds} + ${apartments.singleBeds}`, input.beds));
    }
    if (input?.sofas) {
        conditions.push(gte(sql`${apartments.doubleSofas} + ${apartments.singleSofas}`, input.sofas));
    }
    if (input?.metro) {
        conditions.push(and(gt(apartments.minsToMetro, 0), lte(apartments.minsToMetro, input.metro)));
    }

    return conditions;
}
