import { index, pgEnum, pgTable } from 'drizzle-orm/pg-core';

import { apartments } from './apartment';
import { users } from './user';

export const bookingStatusEnum = pgEnum('booking_status', [
    'new', // только что создана, ждёт ответа владельца
    'approved', // владелец подтвердил
    'rejected', // владелец отклонил
    'cancelled', // отменена (гостем или владельцем)
    'expired', // просрочена — владелец не ответил вовремя (ставит cron в booking-expiry.ts)
]);

export const booking = pgTable(
    'radius_booking',
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        apartmentId: d
            .integer()
            .notNull()
            .references(() => apartments.id, { onDelete: 'cascade' }),
        userId: d.varchar({ length: 255 }).references(() => users.id),
        guestName: d.varchar({ length: 255 }).notNull(),
        guestPhone: d.varchar({ length: 50 }).notNull(),
        guests: d.integer().notNull(),
        children: d.integer().notNull().default(0),
        checkInDate: d.date({ mode: 'date' }).notNull(),
        checkOutDate: d.date({ mode: 'date' }).notNull(),
        message: d.text(),
        status: bookingStatusEnum('status').notNull().default('new'),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [index('booking_apartment_idx').on(t.apartmentId), index('booking_user_idx').on(t.userId)],
);
