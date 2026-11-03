import { index, pgTable } from 'drizzle-orm/pg-core';

import { users } from './user';

export const supportTicket = pgTable(
    'radius_support_ticket',
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        userId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id),
        assignedToId: d.varchar({ length: 255 }).references(() => users.id),
        status: d.varchar({ length: 20 }).notNull().default('open'),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [index('support_ticket_user_idx').on(t.userId)],
);
