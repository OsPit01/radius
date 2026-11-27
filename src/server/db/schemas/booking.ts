import { sql } from 'drizzle-orm';
import { index, pgEnum, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';

import { BOOKING_STATUS_VALUES, TRIP_PURPOSE_VALUES } from '@/lib/constants/booking';
import { CANCEL_BY_VALUES } from '@/lib/constants/cancel-reasons';

import { apartments } from './apartment';
import { users } from './user';

export const bookingStatusEnum = pgEnum('booking_status', BOOKING_STATUS_VALUES);
export const cancelByEnum = pgEnum('cancel_by', CANCEL_BY_VALUES);
export const tripPurposeEnum = pgEnum('trip_purpose', TRIP_PURPOSE_VALUES);

export const booking = pgTable(
    'radius_booking',
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        apartmentId: d
            .integer()
            .notNull()
            .references(() => apartments.id, { onDelete: 'cascade' }),
        // set null, а НЕ cascade: удаление аккаунта гостя не должно стирать
        // историю броней (данные гостя продублированы в guestName/guestPhone)
        // и, каскадом через диалог, переписку владельца.
        userId: d.varchar({ length: 255 }).references(() => users.id, { onDelete: 'set null' }),
        guestName: d.varchar({ length: 255 }).notNull(),
        guestPhone: d.varchar({ length: 50 }).notNull(),
        guests: d.integer().notNull(),
        children: d.integer().notNull().default(0),
        checkInDate: d.date({ mode: 'date' }).notNull(),
        checkOutDate: d.date({ mode: 'date' }).notNull(),
        message: d.text(),
        status: bookingStatusEnum('status').notNull().default('new'),
        // Кто отменил бронь: 'guest' (гость) или 'owner' (владелец). Пусто = не отменялась.
        cancelledBy: cancelByEnum('cancelledBy'),
        // Причина отмены/отклонения («Даты уже забронированы»).
        cancelReason: d.text(),
        // Цель поездки («Рабочая поездка», «Отдых»…) — заполнит гость при бронировании.
        tripPurpose: tripPurposeEnum('tripPurpose'),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    (t) => [
        index('booking_apartment_idx').on(t.apartmentId),
        index('booking_user_idx').on(t.userId),
        // Быстрый поиск просроченных заявок в expireStaleBookings
        // (WHERE status = 'new' AND created_at < cutoff) — без индекса
        // каждый вызов делал полное сканирование таблицы.
        index('booking_status_created_idx').on(t.status, t.createdAt),
        // ЗАЩИТА ОТ ДУБЛЕЙ НА УРОВНЕ БД: у одного гостя не может быть двух
        // АКТИВНЫХ заявок (new/approved) на один объект и те же даты.
        // Partial-индекс покрывает только активные статусы: отклонённые/
        // отменённые/истёкшие не мешают отправить новую заявку на те же даты.
        // SELECT-проверка в коде — лишь быстрый путь с понятной ошибкой;
        // гонку параллельных запросов гасит именно индекс.
        uniqueIndex('booking_active_dup_idx')
            .on(t.userId, t.apartmentId, t.checkInDate, t.checkOutDate)
            .where(sql`status IN ('new', 'approved')`),
    ],
);
