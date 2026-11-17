import { relations } from 'drizzle-orm';

import { accounts } from './schemas/account';
import { apartments } from './schemas/apartment';
import { booking } from './schemas/booking';
import { conversation } from './schemas/conversation';
import { favorites } from './schemas/favorite';
import { message } from './schemas/message';
import { notification } from './schemas/notification';
import { sessions } from './schemas/session';
import { supportMessage } from './schemas/support-message';
import { supportTicket } from './schemas/support-ticket';
import { users } from './schemas/user';

// ВСЕ relations() живут ТОЛЬКО здесь. Они ссылаются сразу на несколько таблиц, а таблицы
// на этот файл НЕ ссылаются — поэтому циклов импорта нет. Не переносить relations в файлы таблиц.

// users — центральная сущность: на неё ссылаются почти все таблицы.
// relationName нужен ТОЛЬКО там, где между users и другой таблицей БОЛЬШЕ ОДНОЙ связи
// (conversation: guest + owner; supportTicket: owner + assignedAdmin). Для одиночных
// связей имя не нужно — Drizzle сам сопоставит one/many по внешнему ключу.
export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    ownedSupportTickets: many(supportTicket, { relationName: 'supportTicketOwner' }),
    assignedSupportTickets: many(supportTicket, { relationName: 'supportTicketAssignedAdmin' }),
    sentSupportMessages: many(supportMessage, { relationName: 'supportMessageSender' }),
    // Объекты, которыми владеет юзер (createdById).
    apartments: many(apartments),
    // Брони, которые сделал юзер.
    bookings: many(booking),
    // Избранное юзера.
    favorites: many(favorites),
    // Сообщения в чатах, отправленные юзером.
    sentMessages: many(message),
    // Беседы, где юзер — гость или владелец объекта (ДВЕ связи — поэтому relationName).
    guestConversations: many(conversation, { relationName: 'conversationGuest' }),
    ownedConversations: many(conversation, { relationName: 'conversationOwner' }),
    // Уведомления юзера.
    notifications: many(notification),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// Объект: принадлежит одному владельцу, имеет много броней, избранного и уведомлений.
export const apartmentsRelations = relations(apartments, ({ one, many }) => ({
    owner: one(users, { fields: [apartments.createdById], references: [users.id] }),
    bookings: many(booking),
    favorites: many(favorites),
    notifications: many(notification),
}));

// Бронь: на один объект и от одного юзера.
export const bookingRelations = relations(booking, ({ one }) => ({
    apartment: one(apartments, { fields: [booking.apartmentId], references: [apartments.id] }),
    user: one(users, { fields: [booking.userId], references: [users.id] }),
}));

// Избранное: одна строка = один юзер + один объект.
export const favoritesRelations = relations(favorites, ({ one }) => ({
    user: one(users, { fields: [favorites.userId], references: [users.id] }),
    apartment: one(apartments, { fields: [favorites.apartmentId], references: [apartments.id] }),
}));

// Беседа: привязана к одной брони, имеет гостя и владельца (ДВЕ связи с users),
// и много сообщений.
export const conversationRelations = relations(conversation, ({ one, many }) => ({
    booking: one(booking, { fields: [conversation.bookingId], references: [booking.id] }),
    guest: one(users, {
        fields: [conversation.guestId],
        references: [users.id],
        relationName: 'conversationGuest',
    }),
    owner: one(users, {
        fields: [conversation.ownerId],
        references: [users.id],
        relationName: 'conversationOwner',
    }),
    messages: many(message),
}));

// Сообщение чата: принадлежит одной беседе, написано одним отправителем.
export const messageRelations = relations(message, ({ one }) => ({
    conversation: one(conversation, { fields: [message.conversationId], references: [conversation.id] }),
    sender: one(users, { fields: [message.senderId], references: [users.id] }),
}));

// Уведомление: принадлежит одному юзеру и (не всегда) одному объекту.
export const notificationRelations = relations(notification, ({ one }) => ({
    user: one(users, { fields: [notification.userId], references: [users.id] }),
    apartment: one(apartments, { fields: [notification.apartmentId], references: [apartments.id] }),
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
