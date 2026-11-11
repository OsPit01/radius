import { relations } from 'drizzle-orm';

import { accounts } from './schemas/account';
import { sessions } from './schemas/session';
import { supportMessage } from './schemas/support-message';
import { supportTicket } from './schemas/support-ticket';
import { users } from './schemas/user';

// ВСЕ relations() живут ТОЛЬКО здесь. Они ссылаются сразу на несколько таблиц, а таблицы
// на этот файл НЕ ссылаются — поэтому циклов импорта нет. Не переносить relations в файлы таблиц.
export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    ownedSupportTickets: many(supportTicket, { relationName: 'supportTicketOwner' }),
    assignedSupportTickets: many(supportTicket, { relationName: 'supportTicketAssignedAdmin' }),
    sentSupportMessages: many(supportMessage, { relationName: 'supportMessageSender' }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
// Заявка поддержки: автор (owner) и ведущий админ (assignedAdmin) — ДВЕ связи
// с users, поэтому обе получили relationName: по именам Drizzle их различает.
// messages: у заявки МНОГО сообщений — обратная сторона supportMessage.ticket.
export const supportTicketRelations = relations(supportTicket, ({ one, many }) => ({
    owner: one(users, {
        fields: [supportTicket.userId],
        references: [users.id],
        relationName: 'supportTicketOwner',
    }),
    assignedAdmin: one(users, {
        fields: [supportTicket.assignedToId],
        references: [users.id],
        relationName: 'supportTicketAssignedAdmin',
    }),
    messages: many(supportMessage),
}));

// Сообщение поддержки: принадлежит ОДНОЙ заявке и написано ОДНИМ отправителем.
export const supportMessageRelations = relations(supportMessage, ({ one }) => ({
    ticket: one(supportTicket, {
        fields: [supportMessage.ticketId],
        references: [supportTicket.id],
    }),
    sender: one(users, {
        fields: [supportMessage.senderId],
        references: [users.id],
        relationName: 'supportMessageSender',
    }),
}));
