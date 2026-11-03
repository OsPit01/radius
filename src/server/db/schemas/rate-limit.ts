import { pgTable } from 'drizzle-orm/pg-core';

// ======== Rate limit (защита от флуда) ============= //
// Ключ — строка вида `booking:{userId}` или `upload:{userId}`.
// Счётчик живёт до наступления resetAt, затем окно начинается заново.
export const rateLimit = pgTable('radius_rate_limit', (d) => ({
    key: d.varchar({ length: 255 }).notNull().primaryKey(),
    count: d.integer().notNull().default(0),
    resetAt: d.timestamp({ withTimezone: true }).notNull(),
}));
