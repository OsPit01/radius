import { pgTable } from 'drizzle-orm/pg-core';

import { conversation } from './conversation';
import { users } from './user';

export const message = pgTable('radius_message', (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    conversationId: d
        .integer()
        .notNull()
        .references(() => conversation.id, { onDelete: 'cascade' }),
    senderId: d
        .varchar({ length: 255 })
        .notNull()
        .references(() => users.id),
    text: d.text().notNull(),
    isRead: d.boolean().notNull().default(false), // Прочитал ли получатель это сообщение (для счётчика непрочитанных).
    createdAt: d
        .timestamp({ withTimezone: true })
        .$defaultFn(() => new Date())
        .notNull(),
}));
