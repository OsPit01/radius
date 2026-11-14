import { and, eq, lt } from 'drizzle-orm';

import { db } from '@/server/db';
import { apartments, booking } from '@/server/db/schemas';
import { notifyUser } from '@/server/notify';

// Сколько часов заявка «живёт» без реакции владельца. После этого — автоотмена.
const BOOKING_EXPIRY_HOURS = 12;

/**
 * Автоматически отменяет «застрявшие» заявки: те, что в статусе `new`
 * и не получили ответ владельца дольше BOOKING_EXPIRY_HOURS.
 *
 * Для каждой такой заявки:
 * 1) меняем статус на `expired`;
 * 2) уведомляем гостя (колокольчик + телеграм, если подключён);
 * 3) уведомляем владельца (колокольчик + телеграм, если подключён).
 *
 * Возвращает количество отменённых заявок.
 */
export async function expireStaleBookings(): Promise<number> {
    // Граница: всё, что создано раньше этого момента, считается просроченным.
    const cutoff = new Date(Date.now() - BOOKING_EXPIRY_HOURS * 60 * 60 * 1000);

    // Находим просроченные заявки со статусом "new" + данные квартиры.
    // ChatId владельца здесь больше не нужен — его смотрит notifyUser сам.
    const stale = await db
        .select({
            booking: booking,
            apartment: {
                title: apartments.title,
                createdById: apartments.createdById,
            },
        })
        .from(booking)
        .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
        .where(and(eq(booking.status, 'new'), lt(booking.createdAt, cutoff)));

    for (const row of stale) {
        const { booking: b, apartment } = row;

        // 1) Меняем статус заявки на "expired".
        await db.update(booking).set({ status: 'expired' }).where(eq(booking.id, b.id));

        // 2) Уведомляем гостя (если бронировал авторизованным): колокольчик + телеграм.
        if (b.userId) {
            await notifyUser(db, {
                userId: b.userId,
                type: 'booking_expired',
                title: 'Заявка отменена автоматически',
                text: `Ваша заявка на «${apartment.title}» отменена: истекло время ожидания (${BOOKING_EXPIRY_HOURS} ч).`,
                apartmentId: b.apartmentId,
                link: '/profile/bookings',
            });
        }

        // 3) Уведомляем владельца: колокольчик + телеграм одним вызовом
        //    (notifyUser сам посмотрит telegramChatId владельца).
        if (apartment.createdById) {
            await notifyUser(db, {
                userId: apartment.createdById,
                type: 'booking_expired',
                title: 'Заявка истекла',
                text: `Заявка на «${apartment.title}» отменена автоматически: гость не получил ответа в течение ${BOOKING_EXPIRY_HOURS} ч.`,
                apartmentId: b.apartmentId,
                link: '/profile/bookings',
                telegramText: `⏰ Заявка на «${apartment.title}» отменена автоматически — прошло ${BOOKING_EXPIRY_HOURS} ч без ответа.`,
            });
        }
    }

    return stale.length;
}
