import { index, pgTable } from 'drizzle-orm/pg-core';

import { supportTicket } from './support-ticket';
import { users } from './user';

export const supportMessage = pgTable(
    'radius_support_message',
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        ticketId: d
            .integer()
            .references(() => supportTicket.id)
            .notNull(),
        senderId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id),
        text: d.text().notNull(),
        isRead: d.boolean().default(false).notNull(),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [index('support_message_ticket_idx').on(t.ticketId)],
);
