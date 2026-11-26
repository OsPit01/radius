import { index, pgEnum, pgTable } from 'drizzle-orm/pg-core';

import { MESSAGE_TYPE_VALUES } from '@/lib/chat';

import { conversation } from './conversation';
import { users } from './user';

export const messageTypeEnum = pgEnum('message_type', MESSAGE_TYPE_VALUES);
export const message = pgTable(
    'radius_message',
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        conversationId: d
            .integer()
            .notNull()
            .references(() => conversation.id, { onDelete: 'cascade' }),
        senderId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        text: d.text().notNull(),
        type: messageTypeEnum('type').notNull().default('user'),
        // Ссылка на страницу (например, детали брони) — только у системных сообщений.
        // У обычных — null, и ссылка в интерфейсе не показывается.
        link: d.varchar({ length: 255 }),
        targetUserId: d.varchar({ length: 255 }).references(() => users.id, { onDelete: 'set null' }),
        isRead: d.boolean().notNull().default(false), // Прочитал ли получатель это сообщение (для счётчика непрочитанных).
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [index('message_conversation_idx').on(t.conversationId)],
);
