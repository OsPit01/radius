import { pgTable } from 'drizzle-orm/pg-core';

// ======== Аналитика: уникальные переходы на сайт ============= //
// visitorId — уникальный id браузера (генерируется на клиенте, хранится
// в localStorage). Первичный ключ гарантирует: один браузер = один переход,
// повторные заходы (обновление страницы, возврат) не учитываются.
export const siteVisit = pgTable('radius_site_visit', (d) => ({
    visitorId: d.varchar({ length: 64 }).notNull().primaryKey(),
    createdAt: d
        .timestamp({ withTimezone: true })
        .$defaultFn(() => new Date())
        .notNull(),
}));
