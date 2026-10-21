import { and, eq, lt } from 'drizzle-orm';

import { sendTelegramMessage } from '@/lib/telegram';
import { db } from '@/server/db';
import { apartments, booking, notification, users } from '@/server/db/schema';

// Сколько часов заявка «живёт» без реакции владельца. После этого — автоотмена.
const BOOKING_EXPIRY_HOURS = 12;

/**
 * Автоматически отменяет «застрявшие» заявки: те, что в статусе `new`
 * и не получили ответ владельца дольше BOOKING_EXPIRY_HOURS.
 *
 * Для каждой такой заявки:
 * 1) меняем статус на `expired`;
 * 2) уведомляем гостя на сайте;
 * 3) уведомляем владельца на сайте и в Telegram.
 *
 * Возвращает количество отменённых заявок.
 */
export async function expireStaleBookings(): Promise<number> {
    // Граница: всё, что создано раньше этого момента, считается просроченным.
    const cutoff = new Date(Date.now() - BOOKING_EXPIRY_HOURS * 60 * 60 * 1000);

    // Находим просроченные заявки со статусом "new" + данные квартиры и владельца.
    const stale = await db
        .select({
            booking: booking,
            apartment: {
                title: apartments.title,
                createdById: apartments.createdById,
            },
            ownerTelegramChatId: users.telegramChatId,
        })
        .from(booking)
        .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
        .innerJoin(users, eq(apartments.createdById, users.id))
        .where(and(eq(booking.status, 'new'), lt(booking.createdAt, cutoff)));

    for (const row of stale) {
        const { booking: b, apartment, ownerTelegramChatId } = row;

        // 1) Меняем статус заявки на "expired".
        await db.update(booking).set({ status: 'expired' }).where(eq(booking.id, b.id));

        // 2) Уведомляем гостя на сайте (если он бронировал авторизованным).
        if (b.userId) {
            await db.insert(notification).values({
                userId: b.userId,
                type: 'booking_expired',
                title: 'Заявка отменена автоматически',
                text: `Ваша заявка на «${apartment.title}» отменена: истекло время ожидания (${BOOKING_EXPIRY_HOURS} ч).`,
                apartmentId: b.apartmentId,
                link: '/profile/bookings',
            });
        }

        // 3) Уведомляем владельца на сайте (если владелец есть).
        if (apartment.createdById) {
            await db.insert(notification).values({
                userId: apartment.createdById,
                type: 'booking_expired',
                title: 'Заявка истекла',
                text: `Заявка на «${apartment.title}» отменена автоматически: гость не получил ответ в течение ${BOOKING_EXPIRY_HOURS} ч.`,
                apartmentId: b.apartmentId,
                link: '/profile/bookings',
            });
        }

        // 4) Уведомляем владельца в Telegram (если подключён).
        if (ownerTelegramChatId) {
            await sendTelegramMessage(
                ownerTelegramChatId,
                `⏰ Заявка на «${apartment.title}» отменена автоматически — прошло ${BOOKING_EXPIRY_HOURS} ч без ответа.`,
            );
        }
    }

    return stale.length;
}
