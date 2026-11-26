import { and, eq, lt } from 'drizzle-orm';

import { BOOKING_LINKS } from '@/lib/constants/notification';
import { db } from '@/server/db';
import { booking } from '@/server/db/schemas';
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
    // db.query + relations: бронь сама подтягивает свой объект (связь booking.apartment).
    // columns ограничивает выборку двумя нужными полями — не тащим лишние (images и т.п.).
    // ChatId владельца здесь больше не нужен — его смотрит notifyUser сам.
    const stale = await db.query.booking.findMany({
        where: and(eq(booking.status, 'new'), lt(booking.createdAt, cutoff)),
        with: { apartment: { columns: { title: true, createdById: true } } },
    });

    for (const b of stale) {
        const { apartment } = b;

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
                // Гость смотрит свои брони, а не заявки на свой объект.
                link: BOOKING_LINKS.guest,
            });
        }

        // 3) Уведомляем владельца: колокольчик + каналы одним вызовом
        //    (notifyUser сам посмотрит подключённые каналы владельца).
        if (apartment.createdById) {
            await notifyUser(db, {
                userId: apartment.createdById,
                type: 'booking_expired',
                title: 'Заявка истекла',
                text: `Заявка на «${apartment.title}» отменена автоматически: гость не получил ответа в течение ${BOOKING_EXPIRY_HOURS} ч.`,
                apartmentId: b.apartmentId,
                // Уведомление владельцу: ссылка на его входящие заявки, не на брони гостя.
                link: BOOKING_LINKS.owner,
                telegramText: `⏰ Заявка на «${apartment.title}» отменена автоматически — прошло ${BOOKING_EXPIRY_HOURS} ч без ответа.`,
            });
        }
    }

    return stale.length;
}
