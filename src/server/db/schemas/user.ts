import { pgTable } from 'drizzle-orm/pg-core';

export const users = pgTable('radius_user', (d) => ({
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
    role: d.varchar({ length: 50 }).notNull().default('user'),
    totalBookings: d.integer().notNull().default(0),
    totalFavorites: d.integer().notNull().default(0),
    totalApartments: d.integer().notNull().default(0),
    bannedUntil: d.timestamp({ withTimezone: true }),
    telegramChatId: d.varchar({ length: 50 }), // куда слать уведомления о брони
    telegramLinkCode: d.varchar({ length: 10 }), // Одноразовый код для привязки Telegram (после привязки стирается).
}));
