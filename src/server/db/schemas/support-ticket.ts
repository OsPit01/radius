import { sql } from 'drizzle-orm';
import { index, pgEnum, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';

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
            .references(() => users.id, { onDelete: 'cascade' }),
        // assignedToId → set null (заявка остаётся, ведущего нет)
        assignedToId: d.varchar({ length: 255 }).references(() => users.id, { onDelete: 'set null' }),
        status: supportTicketStatusEnum('status').notNull().default('open'),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [
        index('support_ticket_user_idx').on(t.userId),
        // «Одна непрерывная беседа на пользователя» на уровне БД: не может
        // существовать ДВУХ ОТКРЫТЫХ заявок одного юзера. Partial-индекс
        // покрывает только открытые: закрытая не мешает создать новую.
        // Гонку двух параллельных openOrGetTicket гасит индекс, а не код.
        uniqueIndex('support_ticket_open_user_unique')
            .on(t.userId)
            .where(sql`status = 'open'`),
    ],
);
