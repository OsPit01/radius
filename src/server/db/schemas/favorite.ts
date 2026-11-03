import { index, pgTable, primaryKey } from 'drizzle-orm/pg-core';

import { apartments } from './apartment';
import { users } from './user';

export const favorites = pgTable(
    'radius_favorite',
    (d) => ({
        userId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id),
        apartmentId: d
            .integer()
            .notNull()
            .references(() => apartments.id, { onDelete: 'cascade' }),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [primaryKey({ columns: [t.userId, t.apartmentId] }), index('favorite_user_id_idx').on(t.userId)],
);
