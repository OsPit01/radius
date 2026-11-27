import { and, eq, lt } from 'drizzle-orm';

import { BOOKING_LINKS } from '@/lib/constants/notification';
import { BOOKING_DECISION_TEXTS, buildBookingTelegramText, insertBookingSystemMessage } from '@/server/booking-chat';
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
 * 1) меняем статус на `expired` — ОДНИМ атомарным UPDATE ... FROM ... RETURNING;
 * 2) пишем системное сообщение в чат (видят оба участника);
 * 3) уведомляем гостя и владельца (колокольчик + телеграм, если подключён).
 *
 * Возвращает количество отменённых заявок.
 *
 * Почему атомарный UPDATE, а не SELECT → цикл UPDATE: старый вариант допускал
 * гонку — два параллельных вызова (cron каждые 10 минут + ручной curl, или
 * зависший предыдущий вызов) выбирали ОДНИ И ТЕ ЖЕ просроченные строки и оба
 * слали уведомления. UPDATE ... RETURNING отдаёт строку ровно одному вызову:
 * повторный запуск уже не найдёт их (статус сменился, WHERE не совпадает).
 */
export async function expireStaleBookings(): Promise<number> {
    // Граница: всё, что создано раньше этого момента, считается просроченным.
    const cutoff = new Date(Date.now() - BOOKING_EXPIRY_HOURS * 60 * 60 * 1000);

    // Один запрос вместо двух: смена статуса + данные квартиры для текстов.
    // WHERE гарантирует, что каждая заявка «истекает» ровно один раз.
    // eslint-disable-next-line drizzle/enforce-update-with-where -- .where() есть ниже в цепочке (после .from()); правило его не видит из-за .from() между .set() и .where()
    const expired = await db
        .update(booking)
        .set({ status: 'expired' })
        .from(apartments)
        .where(and(eq(booking.status, 'new'), lt(booking.createdAt, cutoff), eq(apartments.id, booking.apartmentId)))
        .returning({
            id: booking.id,
            userId: booking.userId,
            apartmentId: booking.apartmentId,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            guestName: booking.guestName,
            guestPhone: booking.guestPhone,
            guests: booking.guests,
            children: booking.children,
            tripPurpose: booking.tripPurpose,
            message: booking.message,
            title: apartments.title,
            address: apartments.formattedAddress,
            checkInTime: apartments.checkInTime,
            checkOutTime: apartments.checkOutTime,
            price: apartments.price,
            ownerId: apartments.createdById,
        });

    for (const b of expired) {
        // Системное сообщение в чат: событие создала СИСТЕМА, а не человек,
        // поэтому senderId = null; targetUserId = null — видно ОБОИМ участникам.
        await insertBookingSystemMessage(db, b.id, {
            senderId: null,
            targetUserId: null,
            text: BOOKING_DECISION_TEXTS.expired,
        });

        // Уведомляем гостя (если бронировал авторизованным): колокольчик + телеграм.
        if (b.userId) {
            await notifyUser(db, {
                userId: b.userId,
                type: 'booking_expired',
                title: 'Заявка отменена автоматически',
                text: `Ваша заявка на «${b.title}» отменена: истекло время ожидания (${BOOKING_EXPIRY_HOURS} ч).`,
                apartmentId: b.apartmentId,
                // Гость смотрит свои брони, а не заявки на свой объект.
                link: BOOKING_LINKS.guest,
                telegramText: buildBookingTelegramText('expired_guest', {
                    title: b.title,
                    address: b.address ?? null,
                    price: b.price ?? null,
                    checkIn: b.checkInDate,
                    checkOut: b.checkOutDate,
                    checkInTime: b.checkInTime ?? null,
                    checkOutTime: b.checkOutTime ?? null,
                    expiryHours: BOOKING_EXPIRY_HOURS,
                }),
            });
        }

        // Уведомляем владельца: колокольчик + каналы одним вызовом
        // (notifyUser сам посмотрит подключённые каналы владельца).
        if (b.ownerId) {
            await notifyUser(db, {
                userId: b.ownerId,
                type: 'booking_expired',
                title: 'Заявка истекла',
                text: `Заявка на «${b.title}» отменена автоматически: гость не получил ответа в течение ${BOOKING_EXPIRY_HOURS} ч.`,
                apartmentId: b.apartmentId,
                // Уведомление владельцу: ссылка на его входящие заявки, не на брони гостя.
                link: BOOKING_LINKS.owner,
                telegramText: buildBookingTelegramText('expired_owner', {
                    title: b.title,
                    address: b.address ?? null,
                    guestName: b.guestName,
                    guestPhone: b.guestPhone,
                    guests: b.guests,
                    children: b.children ?? 0,
                    checkIn: b.checkInDate,
                    checkOut: b.checkOutDate,
                    checkInTime: b.checkInTime ?? null,
                    checkOutTime: b.checkOutTime ?? null,
                    tripPurpose: b.tripPurpose ?? null,
                    message: b.message ?? null,
                    expiryHours: BOOKING_EXPIRY_HOURS,
                }),
            });
        }
    }

    return expired.length;
}
