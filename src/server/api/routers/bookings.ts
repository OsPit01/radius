import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray, type SQL, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { z } from 'zod';

import { BOOKING_LINKS } from '@/lib/constants/notification';
import { isAdminRole } from '@/lib/constants/roles';
import { createBookingSchema } from '@/lib/validation/booking';
import { idSchema } from '@/lib/validation/common';
import { hideTestApartments } from '@/server/apartment-selects';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import {
    BOOKING_DECISION_TEXTS,
    buildBookingTelegramText,
    buildGuestSummary,
    buildOwnerSummary,
    insertBookingSystemMessage,
} from '@/server/booking-chat';
import type * as schema from '@/server/db/schemas';
import { apartments, booking, conversation, users } from '@/server/db/schemas';
import { notifyUser } from '@/server/notify';
import { isUniqueViolation } from '@/server/pg-errors';
import { enforceRateLimit } from '@/server/rate-limit';
import { plural } from '@/utils/plural';

// Лимит НОВЫХ заявок одного гостя: 2 в час. На число разных квартир ограничения
// нет — гость спокойно бронирует несколько объектов, пока укладывается в лимит.
const BOOKING_RATE_LIMIT = 2;
const BOOKING_RATE_WINDOW_MS = 60 * 60 * 1000;

// ============================================================
// СПИСОК БРОНЕЙ С ДАННЫМИ КВАРТИРЫ И ВЛАДЕЛЬЦА
//
// listForOwner и listForUser отличаются ТОЛЬКО условием where
// (чьи брони: на мои квартиры или мои как гостя). Чтобы не дублировать
// 30 строк select/join в двух местах — общая функция с параметром-условием.
// ============================================================
function selectBookingRows(db: PostgresJsDatabase<typeof schema>, where: SQL) {
    return (
        db
            .select({
                booking: booking,
                apartment: {
                    title: apartments.title,
                    city: apartments.city,
                    street: apartments.street,
                    numberHome: apartments.numberHome,
                    images: apartments.images,
                    price: apartments.price,
                },
                owner: {
                    id: users.id,
                    name: users.name,
                    phone: users.phone,
                    firstName: users.firstName,
                    lastName: users.lastName,
                },
            })
            .from(booking)
            .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
            // leftJoin, а НЕ innerJoin: createdById nullable — при innerJoin строка
            // с «битым» владельцем просто ИСЧЕЗАЛА бы из списков (гость не видел бы
            // свою бронь, владелец — заявку). leftJoin вернёт owner = null.
            .leftJoin(users, eq(apartments.createdById, users.id))
            .where(where)
            .orderBy(desc(booking.createdAt))
    );
}

export const bookingsRouter = createTRPCRouter({
    create: protectedProcedure.input(createBookingSchema).mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;

        const [apartment] = await ctx.db
            .select()
            .from(apartments)
            .where(and(eq(apartments.id, input.apartmentId), hideTestApartments(ctx.session.user.role)));

        if (!apartment) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Квартира не найдена',
            });
        }

        if (apartment.status !== 'active') {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Квартира недоступна для бронирования',
            });
        }

        if (input.checkOutDate <= input.checkInDate) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Дата выезда должна быть позже даты заезда',
            });
        }

        // Заезд не может быть в прошлом. Сервер живёт в UTC, а клиент передаёт дату
        // как YYYY-MM-DD → z.coerce.date() даёт полночь UTC. Сравниваем с началом
        // сегодняшних суток UTC: всё, что раньше, — уже прошло. Это серверный рубеж,
        // который нельзя обойти через DevTools (min в форме — только удобство).
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        if (input.checkInDate < todayStart) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Дата заезда не может быть в прошлом',
            });
        }

        if (apartment.capacity > 0 && input.guests > apartment.capacity) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Квартира вмещает до ${apartment.capacity} ${plural(apartment.capacity, 'гостя', 'гостей', 'гостей')}`,
            });
        }

        // Должен быть хотя бы один взрослый: детей не может быть столько же,
        // сколько гостей суммарно.
        if (input.children >= input.guests) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Нужен хотя бы один взрослый',
            });
        }

        // Владелец не может бронировать собственный объект —
        // иначе получился бы чат «сам с собой» (guestId === ownerId).
        if (apartment.createdById === userId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Нельзя забронировать свою квартиру',
            });
        }

        // Владельца ищем ДО вставки брони: если его вдруг нет (битые данные
        // объекта), заявка не должна попасть в БД «наполовину» — иначе получим
        // запись, о которой никто не узнает (уведомление шлёт notifyUser по каналам).
        const [owner] = await ctx.db
            .select({
                name: users.name,
                id: users.id,
                firstName: users.firstName,
            })
            .from(users)
            .where(eq(users.id, apartment.createdById ?? ''));
        if (!owner?.id) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }

        // Двойной отправки быть не должно: один гость, объект и даты.
        // Ищем только АКТИВНЫЕ заявки — отклонённые/отменённые/истёкшие
        // не мешают отправить новую заявку на те же даты. Проверка ДО лимита,
        // чтобы случайный повторный клик не «съедал» часовую квоту.
        const [duplicate] = await ctx.db
            .select({ id: booking.id })
            .from(booking)
            .where(
                and(
                    eq(booking.userId, userId),
                    eq(booking.apartmentId, input.apartmentId),
                    eq(booking.checkInDate, input.checkInDate),
                    eq(booking.checkOutDate, input.checkOutDate),
                    inArray(booking.status, ['new', 'approved']),
                ),
            )
            .limit(1);
        if (duplicate) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Заявка на эти даты уже отправлена',
            });
        }

        // Лимит проверяем ПОСЛЕ всех валидаций и только перед вставкой:
        // неудачные попытки (битые даты, своя квартира, отсутствующий владелец)
        // не должны «съедать» квоту гостя. Две валидные заявки в час — норма.
        await enforceRateLimit(ctx.db, `booking:${userId}`, BOOKING_RATE_LIMIT, BOOKING_RATE_WINDOW_MS);

        // ТРАНЗАКЦИЯ: бронь + диалог + счётчик пишутся вместе. Раньше вставки
        // шли по очереди без транзакции — при сбое между ними оставалась
        // «бронь без чата» (владелец не мог связаться с гостем), а гостю
        // приходила ошибка, хотя запись уже лежала в БД.
        // Уникальный индекс в БД (booking_active_dup_idx) гасит гонку дублей:
        // два параллельных запроса на те же даты — второй получит 23505,
        // мы переведём её в понятный CONFLICT.
        let created: { id: number } | null = null;
        try {
            created = await ctx.db.transaction(async (tx) => {
                const [createdBooking] = await tx
                    .insert(booking)
                    .values({
                        apartmentId: input.apartmentId,
                        userId,
                        guestName: input.guestName,
                        guestPhone: input.guestPhone,
                        guests: input.guests,
                        children: input.children ?? 0,
                        checkInDate: input.checkInDate,
                        checkOutDate: input.checkOutDate,
                        message: input.message ?? null,
                        tripPurpose: input.tripPurpose ?? null,
                    })
                    .returning({ id: booking.id });

                if (!createdBooking) {
                    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
                }

                const [createdConversation] = await tx
                    .insert(conversation)
                    .values({
                        bookingId: createdBooking.id,
                        guestId: userId,
                        ownerId: owner.id,
                    })
                    .returning({ id: conversation.id });
                if (!createdConversation) {
                    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
                }

                // Денормализованный счётчик: +1 бронь у гостя (атомарно, без гонки).
                await tx
                    .update(users)
                    .set({ totalBookings: sql`${users.totalBookings} + 1` })
                    .where(eq(users.id, userId));

                return createdBooking;
            });
        } catch (error) {
            // Конфликт уникального индекса = заявка на эти даты уже существует.
            // SELECT-проверка выше ловит обычный повторный клик, этот catch —
            // именно гонку параллельных запросов.
            if (isUniqueViolation(error)) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Заявка на эти даты уже отправлена',
                });
            }
            throw error;
        }

        // Теоретически недостижимо (транзакция либо вернула бронь, либо бросила
        // исключение), но TS не знает про эту связь — страхуемся явно.
        if (!created) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }

        const adults = input.guests - (input.children ?? 0);

        // Системные сообщения в чат: владельцу — данные гостя, гостю — данные владельца.
        // Тексты и вставка — в booking-chat.ts (роутер не размазывает сборку строк).
        await insertBookingSystemMessage(ctx.db, created.id, {
            senderId: userId,
            targetUserId: owner.id,
            text: buildOwnerSummary({
                title: apartment.title,
                guestName: input.guestName,
                guestPhone: input.guestPhone,
                guests: input.guests,
                children: input.children ?? 0,
                checkIn: input.checkInDate,
                checkOut: input.checkOutDate,
            }),
            link: `/profile/bookings/${created.id}`,
        });
        await insertBookingSystemMessage(ctx.db, created.id, {
            senderId: userId,
            targetUserId: userId,
            text: buildGuestSummary({
                title: apartment.title,
                // Имя для гостя: предпочитаем firstName (основное в проекте),
                // затем name, и только если пусто — «Арендодатель».
                ownerName: owner.firstName ?? owner.name ?? 'Арендодатель',
                checkIn: input.checkInDate,
                checkOut: input.checkOutDate,
            }),
            link: `/profile/bookings/${created.id}`,
        });

        // notifyUser = единая точка: колокольчик в БД + каналы владельцу.
        // Красивый HTML-текст для Telegram собирает booking-chat.ts.
        await notifyUser(ctx.db, {
            userId: owner.id,
            type: 'booking_new',
            title: 'Новая заявка на бронирование',
            text: `Заявка на бронирование «${apartment.title}». Заезд: ${input.checkInDate.toLocaleDateString('ru-RU')} выезд: ${input.checkOutDate.toLocaleDateString('ru-RU')} имя гостя: ${input.guestName} номер телефона гостя: ${input.guestPhone} взрослых: ${adults} детей: ${input.children ?? 0}`,
            apartmentId: input.apartmentId,
            // Это уведомление ВЛАДЕЛЬЦУ: ведём его на страницу входящих заявок,
            // а не на «мои брони» (там список гостя и заявок владельца нет).
            link: BOOKING_LINKS.owner,
            telegramText: buildBookingTelegramText('new', {
                title: apartment.title,
                address: apartment.formattedAddress ?? null,
                guestName: input.guestName,
                guestPhone: input.guestPhone,
                guests: input.guests,
                children: input.children ?? 0,
                checkIn: input.checkInDate,
                checkOut: input.checkOutDate,
                checkInTime: apartment.checkInTime ?? null,
                checkOutTime: apartment.checkOutTime ?? null,
                tripPurpose: input.tripPurpose ?? null,
                message: input.message ?? null,
            }),
        });

        // Мутация возвращает созданную бронь (канон «return {id}, а не rows»):
        // клиент может сразу вести гостя на страницу деталей.
        return created;
    }),

    listForOwner: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        // Заявки на квартиры владельца + данные гостя (booking) и владельца (owner).
        return selectBookingRows(ctx.db, eq(apartments.createdById, userId));
    }),
    listForUser: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        // Брони гостя + данные владельца квартиры (чтобы гость мог связаться).
        return selectBookingRows(ctx.db, eq(booking.userId, userId));
    }),

    // Детали одной брони для страницы /profile/bookings/[id].
    // Права: гость видит свою бронь, владелец — заявку на свой объект.
    getById: protectedProcedure.input(z.object({ bookingId: idSchema })).query(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;

        const [row] = await ctx.db
            .select({
                booking: booking,
                apartment: {
                    id: apartments.id,
                    title: apartments.title,
                    formattedAddress: apartments.formattedAddress,
                    images: apartments.images,
                    rating: apartments.rating,
                    checkInTime: apartments.checkInTime,
                    checkOutTime: apartments.checkOutTime,
                    price: apartments.price,
                    createdById: apartments.createdById,
                },
                // Владелец квартиры — гость видит, с кем имеет дело.
                // leftJoin: createdById nullable — при битых данных бронь
                // не должна пропадать из деталей, owner просто будет null.
                owner: {
                    id: users.id,
                    name: users.name,
                    phone: users.phone,
                    firstName: users.firstName,
                },
            })
            .from(booking)
            .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
            .leftJoin(users, eq(apartments.createdById, users.id))
            .where(eq(booking.id, input.bookingId));

        if (!row) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Заявка не найдена' });
        }

        const isGuest = row.booking.userId === userId;
        const isOwner = row.apartment.createdById === userId;
        if (!isGuest && !isOwner) {
            throw new TRPCError({ code: 'FORBIDDEN' });
        }

        return row;
    }),

    cancel: protectedProcedure
        .input(z.object({ bookingId: idSchema, reason: z.string().trim().max(500).optional() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const [targetBooking] = await ctx.db.select().from(booking).where(eq(booking.id, input.bookingId));
            if (!targetBooking) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            const [apartment] = await ctx.db
                .select()
                .from(apartments)
                .where(eq(apartments.id, targetBooking.apartmentId));
            if (!apartment) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            if (targetBooking.userId !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            // Отменять можно только ЖИВУЮ бронь. Иначе гость мог перезаписать
            // уже завершённую заявку (отклонённую/истёкшую): терялась причина
            // владельца, а ему уходил ложный спам «гость отменил».
            if (targetBooking.status !== 'new' && targetBooking.status !== 'approved') {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Бронь уже завершена' });
            }

            // Условие статуса продублировано в WHERE — атомарная защита:
            // даже при гонке двух запросов статус сменится ровно один раз.
            const [updated] = await ctx.db
                .update(booking)
                .set({ status: 'cancelled', cancelledBy: 'guest', cancelReason: input.reason ?? null })
                .where(and(eq(booking.id, input.bookingId), inArray(booking.status, ['new', 'approved'])))
                .returning({ id: booking.id });

            if (!updated) {
                // Между проверкой и UPDATE бронь успела завершиться.
                throw new TRPCError({ code: 'CONFLICT', message: 'Бронь уже завершена' });
            }

            if (apartment?.createdById) {
                // notifyUser = колокольчик + телеграм владельцу, если подключён
                await notifyUser(ctx.db, {
                    userId: apartment.createdById,
                    type: 'booking_cancelled',
                    title: 'Бронь отменена гостем',
                    text: 'Гость отменил бронирование',

                    apartmentId: targetBooking.apartmentId,
                    // Отмена — событие по заявке владельца, ссылка ведёт в его «Мои заявки».
                    link: BOOKING_LINKS.owner,
                    telegramText: buildBookingTelegramText('cancelled', {
                        title: apartment.title,
                        address: apartment.formattedAddress ?? null,
                        guestName: targetBooking.guestName,
                        guestPhone: targetBooking.guestPhone,
                        guests: targetBooking.guests,
                        children: targetBooking.children ?? 0,
                        checkIn: targetBooking.checkInDate,
                        checkOut: targetBooking.checkOutDate,
                        checkInTime: apartment.checkInTime ?? null,
                        checkOutTime: apartment.checkOutTime ?? null,
                        tripPurpose: targetBooking.tripPurpose ?? null,
                        message: targetBooking.message ?? null,
                        reason: input.reason ?? null,
                    }),
                });

                // Системное сообщение в чат владельцу: гость отменил.
                await insertBookingSystemMessage(ctx.db, targetBooking.id, {
                    senderId: userId, // действует гость
                    targetUserId: apartment.createdById, // адресовано владельцу
                    text: BOOKING_DECISION_TEXTS.cancelledByGuest,
                });
            }
            return updated;
        }),

    setStatus: protectedProcedure
        .input(
            z.object({
                bookingId: idSchema,
                status: z.enum(['approved', 'rejected'] as const),
                reason: z.string().trim().max(500).optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // найти ОДНУ бронь по input.bookingId
            const [targetBooking] = await ctx.db.select().from(booking).where(eq(booking.id, input.bookingId));

            if (!targetBooking) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            const [apartment] = await ctx.db
                .select()
                .from(apartments)
                .where(eq(apartments.id, targetBooking.apartmentId));
            if (!apartment) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            // проверить, что владелец квартиры === текущий юзер
            if (apartment.createdById !== userId) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }

            // Решение принимается ТОЛЬКО по заявке в статусе 'new'. Иначе
            // владелец мог «одобрить» истёкшую/отменённую заявку или повторно
            // одобрить уже одобренную — гость получал бы противоречивые
            // уведомления о брони, которая уже завершилась.
            if (targetBooking.status !== 'new') {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Заявка уже обработана' });
            }

            // обновить status у брони и вернуть.
            // Условие статуса продублировано в WHERE — атомарная защита от гонки:
            // два параллельных решения не проскочат оба.
            const [updated] = await ctx.db
                .update(booking)
                .set({
                    status: input.status,
                    // Отклонили — фиксируем, что отменил владелец и почему.
                    ...(input.status === 'rejected'
                        ? { cancelledBy: 'owner', cancelReason: input.reason ?? null }
                        : {}),
                })
                .where(and(eq(booking.id, input.bookingId), eq(booking.status, 'new')))
                .returning({ id: booking.id });

            if (!updated) {
                // Между проверкой и UPDATE заявку успели обработать/отменить.
                throw new TRPCError({ code: 'CONFLICT', message: 'Заявка уже обработана' });
            }

            // Системное сообщение в чат гостю: решение владельца.
            // Гость авторизован всегда в этой ветке (уведомление ниже шлём по userId),
            // но колонка nullable — подстраховка: null = «не адресовано конкретному».
            await insertBookingSystemMessage(ctx.db, targetBooking.id, {
                senderId: userId, // действует владелец
                targetUserId: targetBooking.userId ?? null, // адресовано гостю
                text: input.status === 'approved' ? BOOKING_DECISION_TEXTS.approved : BOOKING_DECISION_TEXTS.rejected,
            });

            //уведомляем гостя если он авторизован (колокольчик + телеграм)
            if (targetBooking.userId) {
                await notifyUser(ctx.db, {
                    userId: targetBooking.userId,
                    type: input.status === 'approved' ? 'booking_approved' : 'booking_rejected',
                    title: `Заявка на «${apartment.title}»`,
                    text: input.status === 'approved' ? 'Одобрена' : 'Отклонена',

                    apartmentId: targetBooking.apartmentId,
                    // Решение принимает владелец, а уведомление получает гость.
                    link: BOOKING_LINKS.guest,
                    telegramText: buildBookingTelegramText(input.status === 'approved' ? 'approved' : 'rejected', {
                        title: apartment.title,
                        address: apartment.formattedAddress ?? null,
                        price: apartment.price ?? null,
                        checkIn: targetBooking.checkInDate,
                        checkOut: targetBooking.checkOutDate,
                        checkInTime: apartment.checkInTime ?? null,
                        checkOutTime: apartment.checkOutTime ?? null,
                        reason: input.reason ?? null,
                    }),
                });
            }
            return updated;
        }),

    // Удалить бронь из БД (и каскадом — диалог и сообщения). Только админ.
    delete: protectedProcedure.input(z.object({ bookingId: idSchema })).mutation(async ({ ctx, input }) => {
        // Удалять может ТОЛЬКО админ и выше.
        if (!isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Недостаточно прав' });
        }

        const [targetBooking] = await ctx.db.select().from(booking).where(eq(booking.id, input.bookingId));
        if (!targetBooking) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }

        await ctx.db.delete(booking).where(eq(booking.id, input.bookingId));

        // Денормализованный счётчик: -1 бронь у гостя (если он был авторизован).
        if (targetBooking.userId) {
            await ctx.db
                .update(users)
                .set({ totalBookings: sql`${users.totalBookings} - 1` })
                .where(eq(users.id, targetBooking.userId));
        }

        return { deleted: true };
    }),
});
