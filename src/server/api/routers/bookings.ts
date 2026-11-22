import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { MAX_BOOKING_GUESTS, MIN_BOOKING_GUESTS } from '@/lib/constants/booking';
import { isAdminRole } from '@/lib/constants/roles';
import { isValidPhoneNumber } from '@/lib/phone';
import { idSchema } from '@/lib/schemas/common';
import { hideTestApartments } from '@/server/apartment-selects';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { expireStaleBookings } from '@/server/booking-expiry';
import { apartments, booking, conversation, message, users } from '@/server/db/schemas';
import { escapeHtml, notifyUser } from '@/server/notify';
import { enforceRateLimit } from '@/server/rate-limit';
import { plural } from '@/utils/plural';

// Защита от флуда: сколько заявок один гость может оставить за одно окно.
const BOOKING_RATE_LIMIT = 5;
const BOOKING_RATE_WINDOW_MS = 10 * 60 * 1000;

const createBookingSchema = z.object({
    apartmentId: z.number().int().positive(),
    guestName: z.string().trim().min(1, 'Укажите имя').max(255),
    guestPhone: z
        .string()
        .trim()
        .min(1, 'Укажите телефон')
        .max(50)
        .refine(isValidPhoneNumber, 'Неверный номер телефона'),
    guests: z
        .number({ message: 'Укажите количество гостей' })
        .int()
        .min(MIN_BOOKING_GUESTS, 'Укажите количество гостей')
        .max(
            MAX_BOOKING_GUESTS,
            `Максимум ${MAX_BOOKING_GUESTS} ${plural(MAX_BOOKING_GUESTS, 'гость', 'гостя', 'гостей')}`,
        ),
    children: z
        .number()
        .int()
        .min(0, 'Число детей не может быть отрицательным')
        .max(
            MAX_BOOKING_GUESTS,
            `Максимум ${MAX_BOOKING_GUESTS} ${plural(MAX_BOOKING_GUESTS, 'ребёнок', 'ребёнка', 'детей')}`,
        )
        .optional()
        .default(0),
    checkInDate: z.coerce.date(),
    checkOutDate: z.coerce.date(),
    message: z.string().trim().max(1000).optional(),
    tripPurpose: z.string().trim().max(100).optional(),
});

export const bookingsRouter = createTRPCRouter({
    create: protectedProcedure.input(createBookingSchema).mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;

        await enforceRateLimit(ctx.db, `booking:${userId}`, BOOKING_RATE_LIMIT, BOOKING_RATE_WINDOW_MS);

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
        // запись, о которой никто не узнает (ни уведомления, ни Telegram).
        const [owner] = await ctx.db
            .select({
                telegramChatId: users.telegramChatId,
                name: users.name,
                id: users.id,
            })
            .from(users)
            .where(eq(users.id, apartment.createdById ?? ''));
        if (!owner?.id) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }

        const [created] = await ctx.db
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
            .returning();

        if (!created) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }
        const [createdConversation] = await ctx.db
            .insert(conversation)
            .values({
                bookingId: created.id,
                guestId: userId,
                ownerId: owner.id,
            })
            .returning();
        if (!createdConversation) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }
        const adults = input.guests - (input.children ?? 0);
        const summary = [
            '📋 Детали бронирования:',
            `Квартира: ${apartment.title}`,
            `Гость: ${input.guestName}`,
            `Телефон: ${input.guestPhone}`,
            `Взрослых: ${adults}`,
            `Детей: ${input.children ?? 0}`,
            `Заезд: ${input.checkInDate.toLocaleDateString('ru-RU')}`,
            `Выезд: ${input.checkOutDate.toLocaleDateString('ru-RU')}`,
        ].join('\n');
        await ctx.db.insert(message).values({
            conversationId: createdConversation.id,
            senderId: userId,
            text: summary,
        });

        // notifyUser = единая точка: колокольчик в БД + телеграм владельцу.
        // В telegramText собираем красивый формат с деталями (в БД он не идёт —
        // там свой text выше). apartment.title экранируем: в нём может быть < или &.
        const telegramLines = [
            `<b>Новая заявка на бронирование</b>`,
            ``,
            `<b>Квартира:</b> ${escapeHtml(apartment.title)}`,
            `<b>Гость:</b> ${escapeHtml(input.guestName)}`,
            `<b>Телефон:</b> ${escapeHtml(input.guestPhone)}`,
            `<b>Взрослых:</b> ${adults}`,
            `<b>Детей:</b> ${input.children ?? 0}`,
            `<b>Заезд:</b> ${input.checkInDate.toLocaleDateString('ru-RU')}`,
            `<b>Выезд:</b> ${input.checkOutDate.toLocaleDateString('ru-RU')}`,
        ];
        if (input.message) {
            telegramLines.push(``, `<b>Комментарий:</b> ${escapeHtml(input.message)}`);
        }

        await notifyUser(ctx.db, {
            userId: owner.id,
            type: 'booking_new',
            title: 'Новая заявка на бронирование',
            text: `Заявка на бронирование «${apartment.title}». Заезд: ${input.checkInDate.toLocaleDateString('ru-RU')} выезд: ${input.checkOutDate.toLocaleDateString('ru-RU')} имя гостя: ${input.guestName} номер телефона гостя: ${input.guestPhone} взрослых: ${adults} детей: ${input.children ?? 0}`,
            apartmentId: input.apartmentId,
            link: '/profile/my-bookings',
            telegramText: telegramLines.join('\n'),
        });
    }),

    listForOwner: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        // Заявки на квартиры владельца + данные гостя (booking) и владельца (owner).
        return ctx.db
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
                    id: apartments.createdById,
                    name: users.name,
                    phone: users.phone,
                    firstName: users.firstName,
                    lastName: users.lastName,
                },
            })
            .from(booking)
            .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
            .innerJoin(users, eq(apartments.createdById, users.id))
            .where(eq(apartments.createdById, userId))
            .orderBy(desc(booking.createdAt));
    }),
    listForUser: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        // Брони гостя + данные владельца квартиры (чтобы гость мог связаться).
        return ctx.db
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
                    id: apartments.createdById,
                    name: users.name,
                    phone: users.phone,
                    firstName: users.firstName,
                    lastName: users.lastName,
                },
            })
            .from(booking)
            .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
            .innerJoin(users, eq(apartments.createdById, users.id))
            .where(eq(booking.userId, userId))
            .orderBy(desc(booking.createdAt));
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
            })
            .from(booking)
            .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
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

            const [updated] = await ctx.db
                .update(booking)
                .set({ status: 'cancelled', cancelledBy: 'guest', cancelReason: input.reason ?? null })
                .where(eq(booking.id, input.bookingId))
                .returning();

            if (apartment?.createdById) {
                // notifyUser = колокольчик + телеграм владельцу, если подключён
                await notifyUser(ctx.db, {
                    userId: apartment.createdById,
                    type: 'booking_cancelled',
                    title: 'Бронь отменена гостем',
                    text: 'Гость отменил бронирование',

                    apartmentId: targetBooking.apartmentId,
                    link: '/profile/my-bookings',
                });
            }
            return updated;
        }),

    // Ленивая автоотмена просроченных заявок: вызывается со страницы «Мои брони»
    // при загрузке, чтобы таймер работал без внешнего cron (Vercel cron платный).
    expireBookings: protectedProcedure.mutation(async ({ ctx }) => {
        // Тяжёлый запрос (сканирует все просроченные брони) — раньше его мог
        // дёргать без счёта любой авторизованный. Лимит: 6 раз в минуту на
        // пользователя — страница зовёт процедуру один раз при загрузке,
        // шести вызовов хватает с запасом (переключение вкладок и т.п.).
        await enforceRateLimit(ctx.db, `expire-bookings:${ctx.session.user.id}`, 6, 60_000);
        const expired = await expireStaleBookings();
        return { expired };
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

            // обновить status у брони и вернуть
            const [updated] = await ctx.db
                .update(booking)
                .set({
                    status: input.status,
                    // Отклонили — фиксируем, что отменил владелец и почему.
                    ...(input.status === 'rejected'
                        ? { cancelledBy: 'owner', cancelReason: input.reason ?? null }
                        : {}),
                })
                .where(eq(booking.id, input.bookingId))
                .returning();
            //уведомляем гостя если он авторизован (колокольчик + телеграм)
            if (targetBooking.userId) {
                await notifyUser(ctx.db, {
                    userId: targetBooking.userId,
                    type: input.status === 'approved' ? 'booking_approved' : 'booking_rejected',
                    title: `Заявка на «${apartment.title}»`,
                    text: input.status === 'approved' ? 'Одобрена' : 'Отклонена',

                    apartmentId: targetBooking.apartmentId,
                    link: '/profile/my-bookings',
                });
            }
            return updated;
        }),

    // Удалить бронь из БД. Гость удаляет свою бронь, владелец — заявку на свою квартиру.
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
        return { deleted: true };
    }),
});
