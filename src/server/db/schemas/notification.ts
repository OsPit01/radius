import { index, pgTable } from 'drizzle-orm/pg-core';

import { apartments } from './apartment';
import { users } from './user';

export const notification = pgTable(
    'radius_notification',
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        userId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id),
        type: d.varchar({ length: 50 }).notNull(),
        title: d.varchar({ length: 255 }).notNull(),
        text: d.text().notNull(),
        apartmentId: d.integer().references(() => apartments.id, { onDelete: 'set null' }), // Уведомления могут быть не привязаны к объекту (например, сообщение админа).
        isRead: d.boolean().notNull().default(false),
        readAt: d.timestamp({ withTimezone: true }),
        link: d.varchar({ length: 255 }),
        priority: d.varchar({ length: 20 }).default('normal'),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [index('notification_user_idx').on(t.userId)],
);
