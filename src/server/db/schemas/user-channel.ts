import { index, pgEnum, pgTable, unique } from 'drizzle-orm/pg-core';

import { NOTIFICATION_CHANNEL_VALUES } from '@/lib/constants/notification-channels';

import { users } from './user';

// enum БД: в колонку channel невозможно записать мусор ('tg', 'WhatsApp'…)
// — PostgreSQL сам отвергнет. Значения из ЕДИНОГО кортежа констант.
export const notificationChannelEnum = pgEnum('notification_channel', NOTIFICATION_CHANNEL_VALUES);

// ============================================================
// КАНАЛЫ УВЕДОМЛЕНИЙ ПОЛЬЗОВАТЕЛЯ
//
// Один пользователь может подключить несколько каналов (Telegram,
// позже WhatsApp…). Каждый канал — отдельная строка: channel = тип,
// target = «адрес» внутри этого канала (chatId, номер телефона…).
// unique(userId, channel) — нельзя подключить Telegram дважды.
// ============================================================
export const userChannel = pgTable(
    'radius_user_channel',
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        userId: d
            .varchar({ length: 255 })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        channel: notificationChannelEnum('channel').notNull(),
        // «Адрес» внутри канала: у telegram — chatId, у whatsapp — телефон.
        target: d.varchar({ length: 255 }).notNull(),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [
        index('user_channel_user_idx').on(t.userId),
        unique('user_channel_user_channel_unique').on(t.userId, t.channel),
    ],
);
