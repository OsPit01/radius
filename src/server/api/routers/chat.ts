import { TRPCError } from '@trpc/server';
import { and, asc, count, eq, ne, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import z from 'zod';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { apartments, booking, conversation, message, users } from '@/server/db/schema';
import { enforceRateLimit } from '@/server/rate-limit';

// Антифлуд: сколько сообщений может отправить один пользователь за окно времени.
const CHAT_RATE_LIMIT = 30;
const CHAT_RATE_WINDOW_MS = 60 * 1000;

// Диалог ссылается на ДВУХ пользователей (гостя и владельца), поэтому таблицу
// users присоединяем к запросу дважды — через два «псевдонима» (alias).
// Это как две копии одной таблицы: одна отвечает на вопрос «кто гость»,
// другая — «кто владелец».
const guestUser = alias(users, 'guest');
const ownerUser = alias(users, 'owner');

export const chatRouter = createTRPCRouter({
    // ============================================================
    // list — список моих диалогов вместе с собеседниками и квартирой.
    // ============================================================
    list: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const chats = await ctx.db
            .select({
                // Сам диалог (id, bookingId, guestId, ownerId, createdAt).
                conversation: conversation,
                // Кто гость (имя и аватар — чтобы показать в списке бесед).
                guest: {
                    id: guestUser.id,
                    name: guestUser.name,
                    firstName: guestUser.firstName,
                    lastName: guestUser.lastName,
                    image: guestUser.image,
                },
                // Кто владелец.
                owner: {
                    id: ownerUser.id,
                    name: ownerUser.name,
                    firstName: ownerUser.firstName,
                    lastName: ownerUser.lastName,
                    image: ownerUser.image,
                },
                // Какую квартиру бронировали (фото и название для карточки беседы).
                apartment: {
                    title: apartments.title,
                    image: apartments.image,
                    street: apartments.street,
                    formattedAddress: apartments.formattedAddress,
                },
                // Даты брони — для шапки чата (детали бронирования).
                booking: {
                    checkInDate: booking.checkInDate,
                    checkOutDate: booking.checkOutDate,
                },
            })
            .from(conversation)
            // Гостя и владельца присоединяем через leftJoin: даже если пользователь
            // удалён, диалог не пропадёт из списка — просто имя будет null.
            .leftJoin(guestUser, eq(conversation.guestId, guestUser.id))
            .leftJoin(ownerUser, eq(conversation.ownerId, ownerUser.id))
            // Идём по цепочке до квартиры: диалог → бронь → квартира.
            .innerJoin(booking, eq(conversation.bookingId, booking.id))
            .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
            // Только мои диалоги (я гость ИЛИ владелец).
            .where(or(eq(conversation.guestId, userId), eq(conversation.ownerId, userId)));

        // Непрочитанные сообщения, сгруппированные по диалогу: сколько в КАЖДОМ диалоге
        // сообщений, написанных не мной и ещё не прочитанных.
        const unreadRows = await ctx.db
            .select({
                conversationId: message.conversationId,
                unread: count(),
            })
            .from(message)
            .innerJoin(conversation, eq(message.conversationId, conversation.id))
            .where(
                and(
                    or(eq(conversation.guestId, userId), eq(conversation.ownerId, userId)),
                    ne(message.senderId, userId),
                    eq(message.isRead, false),
                ),
            )
            .groupBy(message.conversationId);

        const unreadByConversation = new Map(unreadRows.map((r) => [r.conversationId, r.unread]));

        return chats.map((c) => ({
            ...c,
            unreadCount: unreadByConversation.get(c.conversation.id) ?? 0,
        }));
    }),

    // ============================================================
    // messages — все сообщения конкретного диалога (старые сверху).
    // ============================================================
    messages: protectedProcedure.input(z.object({ conversationId: z.number() })).query(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;

        // Сначала проверяем, что я вообще участник этого диалога.
        const [target] = await ctx.db.select().from(conversation).where(eq(conversation.id, input.conversationId));
        if (!target) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Диалог не найден' });
        }

        const isParticipant = target.guestId === userId || target.ownerId === userId;
        if (!isParticipant) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Нет доступа к этому чату',
            });
        }

        return ctx.db
            .select()
            .from(message)
            .where(eq(message.conversationId, input.conversationId))
            .orderBy(asc(message.createdAt));
    }),

    // ============================================================
    // unreadCount — сколько у меня непрочитанных сообщений (для бейджа).
    // ============================================================
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const [row] = await ctx.db
            .select({ value: count() })
            .from(message)
            .innerJoin(conversation, eq(message.conversationId, conversation.id))
            .where(
                and(
                    // в моих диалогах
                    or(eq(conversation.guestId, userId), eq(conversation.ownerId, userId)),
                    // написанные НЕ мной
                    ne(message.senderId, userId),
                    // и ещё не прочитанные
                    eq(message.isRead, false),
                ),
            );
        return row?.value ?? 0;
    }),

    // ============================================================
    // markRead — отметить сообщения собеседника прочитанными при открытии чата.
    // ============================================================
    markRead: protectedProcedure.input(z.object({ conversationId: z.number() })).mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;

        const [target] = await ctx.db.select().from(conversation).where(eq(conversation.id, input.conversationId));
        if (!target) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Диалог не найден' });
        }

        const isParticipant = target.guestId === userId || target.ownerId === userId;
        if (!isParticipant) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Нет доступа к этому чату',
            });
        }

        await ctx.db
            .update(message)
            .set({ isRead: true })
            .where(and(eq(message.conversationId, input.conversationId), ne(message.senderId, userId)));
        return { ok: true };
    }),

    // ============================================================
    // send — отправить сообщение в диалог (с защитой от флуда).
    // ============================================================
    send: protectedProcedure
        .input(
            z.object({
                conversationId: z.number(),
                text: z.string().trim().min(1).max(500),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Защита от флуда.
            await enforceRateLimit(ctx.db, `chat:${userId}`, CHAT_RATE_LIMIT, CHAT_RATE_WINDOW_MS);

            const [target] = await ctx.db.select().from(conversation).where(eq(conversation.id, input.conversationId));
            if (!target) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Диалог не найден' });
            }

            const isParticipant = target.guestId === userId || target.ownerId === userId;
            if (!isParticipant) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Нет доступа к этому чату',
                });
            }

            const [created] = await ctx.db
                .insert(message)
                .values({
                    conversationId: input.conversationId,
                    senderId: userId,
                    text: input.text,
                })
                .returning();
            return created;
        }),
});
