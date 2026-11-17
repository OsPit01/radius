import { index, pgEnum, pgTable } from 'drizzle-orm/pg-core';

import { NOTIFICATION_TYPE_VALUES } from '@/lib/constants/notification';

import { apartments } from './apartment';
import { users } from './user';

export const notificationTypeEnum = pgEnum('notification_type', NOTIFICATION_TYPE_VALUES);

export const notification = pgTable(
    'radius_notification',
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        userId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: notificationTypeEnum('type').notNull(),
        title: d.varchar({ length: 255 }).notNull(),
        text: d.text().notNull(),
        apartmentId: d.integer().references(() => apartments.id, { onDelete: 'set null' }), // Уведомления могут быть не привязаны к объекту (например, сообщение админа).
        isRead: d.boolean().notNull().default(false),
        readAt: d.timestamp({ withTimezone: true }),
        link: d.varchar({ length: 255 }),

        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [index('notification_user_idx').on(t.userId)],
);
