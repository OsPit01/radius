import { index, pgTable } from 'drizzle-orm/pg-core';

import { booking } from './booking';
import { users } from './user';

export const conversation = pgTable(
    'radius_conversation',
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        bookingId: d
            .integer()
            .notNull()
            .references(() => booking.id, { onDelete: 'cascade' }),
        guestId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id),
        ownerId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id),
        isActive: d.boolean().notNull().default(true), // true = переписка активна; false = заблокирована администратором (участники видят беседу, но не могут отправлять сообщения).
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [index('conversation_guest_idx').on(t.guestId), index('conversation_owner_indx').on(t.ownerId)],
);
