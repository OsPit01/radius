import { index, pgTable } from 'drizzle-orm/pg-core';

import { users } from './user';

export const sessions = pgTable(
    'radius_session',
    (d) => ({
        sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
        userId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id),
        expires: d.timestamp({ mode: 'date', withTimezone: true }).notNull(),
    }),
    (t) => [index('t_user_id_idx').on(t.userId)],
);
