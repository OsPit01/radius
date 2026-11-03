import { relations } from 'drizzle-orm';

import { accounts } from './schemas/account';
import { sessions } from './schemas/session';
import { users } from './schemas/user';

// ВСЕ relations() живут ТОЛЬКО здесь. Они ссылаются сразу на несколько таблиц, а таблицы
// на этот файл НЕ ссылаются — поэтому циклов импорта нет. Не переносить relations в файлы таблиц.
export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
