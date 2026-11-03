import { pgEnum, pgTable, unique } from 'drizzle-orm/pg-core';

import { ROLE_VALUES_TUPLE } from '@/lib/constants/roles';

// Роли: значения из единого корня roles.ts — «любая строка» в колонке уходит в прошлое
export const userRoleEnum = pgEnum('user_role', ROLE_VALUES_TUPLE);
export const users = pgTable(
    'radius_user',
    (d) => ({
        id: d
            .varchar({ length: 255 })
            .notNull()
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        name: d.varchar({ length: 255 }),
        email: d.varchar({ length: 255 }).notNull(),
        phone: d.varchar({ length: 50 }),
        firstName: d.varchar({ length: 100 }),
        lastName: d.varchar({ length: 100 }),
        patronymic: d.varchar({ length: 100 }),
        emailVerified: d.timestamp({
            mode: 'date',
            withTimezone: true,
        }),
        image: d.text(),
        role: userRoleEnum('role').notNull().default('user'),
        totalBookings: d.integer().notNull().default(0),
        totalFavorites: d.integer().notNull().default(0),
        totalApartments: d.integer().notNull().default(0),
        bannedUntil: d.timestamp({ withTimezone: true }),
        telegramChatId: d.varchar({ length: 50 }), // куда слать уведомления о брони
        telegramLinkCode: d.varchar({ length: 10 }), // Одноразовый код для привязки Telegram (после привязки стирается).
        // Email уникален: два аккаунта с одной почтой = путаница авторизации
    }),
    (t) => [unique('users_email_unique').on(t.email)],
);
