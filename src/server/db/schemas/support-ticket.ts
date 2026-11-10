import { index, pgEnum, pgTable } from 'drizzle-orm/pg-core';

import { SUPPORT_TICKET_STATUS_VALUES } from '@/lib/constants/support';

import { users } from './user';

// enum БД: на уровне PostgreSQL в колонку невозможно записать мусор
// ('random'), БД сама отвергнет. Значения — из ЕДИНОГО кортежа констант.
export const supportTicketStatusEnum = pgEnum('support_ticket_status', SUPPORT_TICKET_STATUS_VALUES);

export const supportTicket = pgTable(
    'radius_support_ticket',
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        userId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id),
        assignedToId: d.varchar({ length: 255 }).references(() => users.id),
        status: supportTicketStatusEnum('status').notNull().default('open'),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [index('support_ticket_user_idx').on(t.userId)],
);
