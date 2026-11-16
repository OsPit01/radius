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
            .references(() => users.id, { onDelete: 'cascade' }),
        ownerId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        isActive: d.boolean().notNull().default(true), // true = переписка активна; false = заблокирована администратором (участники видят беседу, но не могут отправлять сообщения).
        // Присутствие участников: когда гость/владелец последний раз читал диалог.
        // Анти-спам телеграма: кто читал недавно (окно PRESENCE_WINDOW_MS в chat.ts)
        // — тому дубль сообщения в телеграм НЕ отправляется, он и так в чате.
        // Обновляется при чтении сообщений (chat.messages) и при отправке (chat.send).
        guestLastSeenAt: d.timestamp({ withTimezone: true }),
        ownerLastSeenAt: d.timestamp({ withTimezone: true }),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [index('conversation_guest_idx').on(t.guestId), index('conversation_owner_idx').on(t.ownerId)],
);
