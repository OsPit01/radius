import { index, pgTable, primaryKey } from 'drizzle-orm/pg-core';

import { apartments } from './apartment';

// ======== Аналитика: уникальные просмотры квартир ============= //
// Один браузер (visitorId) учитывается как один просмотр конкретной
// квартиры — повторные открытия той же квартиры не считаются.
export const apartmentView = pgTable(
    'radius_apartment_view',
    (d) => ({
        visitorId: d.varchar({ length: 64 }).notNull(),
        apartmentId: d
            .integer()
            .notNull()
            .references(() => apartments.id, { onDelete: 'cascade' }),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [
        primaryKey({ columns: [t.visitorId, t.apartmentId] }),
        index('apartment_view_apartment_idx').on(t.apartmentId),
    ],
);
