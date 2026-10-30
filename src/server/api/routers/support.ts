import { TRPCError } from '@trpc/server';
import { and, asc, count, eq, inArray, max, ne } from 'drizzle-orm';
import z from 'zod';

import { MAX_MESSAGE_LENGTH } from '@/lib/chat';
import { ADMIN_ROLES, isAdminRole } from '@/lib/constants/roles';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { notification, supportMessage, supportTicket, users } from '@/server/db/schema';
import { enforceRateLimit } from '@/server/rate-limit';
// Антифлуд: сколько сообщений может отправить один пользователь за окно времени.
const CHAT_RATE_LIMIT = 30;
const CHAT_RATE_WINDOW_MS = 60 * 1000;
export const supportRouter = createTRPCRouter({
    openOrGetTicket: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // 1. Ищем открытую заявку пользователя
        const [existing] = await ctx.db
            .select()
            .from(supportTicket)
            .where(and(eq(supportTicket.userId, userId), eq(supportTicket.status, 'open')));
        if (existing) {
            return existing;
        }
        const [created] = await ctx.db
            .insert(supportTicket)
            .values({
                userId,
            })
            .returning();
        return created;
    }),
    // ============================================================
    // myOpenTicket — «подглядывание»: вернуть ОТКРЫТУЮ заявку юзера,
    // но НЕ СОЗДАВАТЬ новую. Виджет вызывает это при открытии окна:
    // был разговор — подгрузить историю; не было — ничего не плодить.
    // (Раньше заявка создавалась уже при открытии окна — от этого
    // в БД копились ПУСТЫЕ заявки без единого сообщения.)
    // Возвращает тикет или null, если открытой заявки нет.
    // ============================================================
    myOpenTicket: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const [ticket] = await ctx.db
            .select()
            .from(supportTicket)
            .where(and(eq(supportTicket.userId, userId), eq(supportTicket.status, 'open')));
        return ticket ?? null;
    }),

    // ============================================================
    // unreadCount — сколько НЕпрочитанных ответов поддержки у юзера.
    // Для бейджа на кнопке виджета. Паттерн — копия chat.unreadCount:
    // считаем чужие непрочитанные сообщения в своих заявках.
    // ============================================================
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const [row] = await ctx.db
            .select({ value: count() })
            .from(supportMessage)
            .innerJoin(supportTicket, eq(supportMessage.ticketId, supportTicket.id))
            .where(
                and(
                    // заявки — мои
                    eq(supportTicket.userId, userId),
                    // написанные НЕ мной (ответы поддержки)
                    ne(supportMessage.senderId, userId),
                    // и ещё не прочитанные
                    eq(supportMessage.isRead, false),
                ),
            );
        return row?.value ?? 0;
    }),

    messages: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        const [target] = await ctx.db.select().from(supportTicket).where(eq(supportTicket.id, input.id));
        if (!target) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Заявка не найдена',
            });
        }
        const isOwner = target.userId === userId;
        const isAdmin = isAdminRole(ctx.session.user.role);
        if (!isOwner && !isAdmin) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Нет доступа к этой заявке',
            });
        }
        //leftJoin — формула одна: «приклей таблицу users ТАМ, где supportMessage.senderId совпадает с users.id»:
        return (
            ctx.db
                // select({...}) = НАКЛАДНАЯ: как упаковать ответ фронту
                .select({
                    message: supportMessage,
                    sender: {
                        id: users.id,
                        name: users.name,
                        firstName: users.firstName,
                        lastName: users.lastName,
                        image: users.image,
                    },
                })
                .from(supportMessage)
                .leftJoin(users, eq(supportMessage.senderId, users.id))
                .where(eq(supportMessage.ticketId, input.id))
                .orderBy(asc(supportMessage.createdAt))
        );
    }),

    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        const [target] = await ctx.db.select().from(supportTicket).where(eq(supportTicket.id, input.id));
        if (!target) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Не найдено',
            });
        }
        const isOwner = target.userId === userId;
        const isAdmin = isAdminRole(ctx.session.user.role);
        if (!isOwner && !isAdmin) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Нет доступа к этой заявке' });
        }
        await ctx.db
            .update(supportMessage)
            .set({ isRead: true })
            .where(and(eq(supportMessage.ticketId, input.id), ne(supportMessage.senderId, userId)));
        return { ok: true };
    }),

    send: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                text: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            // Защита от флуда.
            await enforceRateLimit(ctx.db, `support:${userId}`, CHAT_RATE_LIMIT, CHAT_RATE_WINDOW_MS);
            const [target] = await ctx.db.select().from(supportTicket).where(eq(supportTicket.id, input.id));
            if (!target) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            const isOwner = target.userId === userId;
            const isAdmin = isAdminRole(ctx.session.user.role);
            if (!isOwner && !isAdmin) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Нет доступа к этой заявке',
                });
            }
            const [created] = await ctx.db
                .insert(supportMessage)
                .values({
                    ticketId: input.id,
                    senderId: userId,
                    text: input.text,
                })
                .returning();
            // ===== Уведомляем админов — ТОЛЬКО если написал ПОЛЬЗОВАТЕЛЬ =====
            // Баг-фикс: раньше уведомления рассылались безусловно, и КАЖДЫЙ ответ
            // админа засыпал уведомлениями всю команду (включая самого отправителя).
            // Правильно: уведомление = сигнал «нужна реакция поддержки» — он нужен,
            // только когда написал не-админ (владелец заявки).
            if (!isAdminRole(ctx.session.user.role)) {
                // Находим всех админов одним запросом
                const admins = await ctx.db
                    .select({ id: users.id })
                    .from(users)
                    .where(inArray(users.role, [...ADMIN_ROLES]));

                // Каждому админу — уведомление о новом сообщении.
                // Batch-вставка: ОДИН запрос с массивом значений вместо N запросов в цикле
                // (N поездок в БД — это медленно и нагружает базу).
                if (admins.length > 0) {
                    await ctx.db.insert(notification).values(
                        admins.map((admin) => ({
                            userId: admin.id,
                            type: 'support_new_message',
                            title: 'Новое сообщение в поддержку',
                            text: `Пользователь написал в поддержку. Заявка #${input.id}`,
                            link: '/admin/support',
                        })),
                    );
                }
            }

            return created;
        }),
    listMine: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        return ctx.db.select().from(supportTicket).where(eq(supportTicket.userId, userId));
    }),
    listAll: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        if (!isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только для администратора',
            });
        }
        // Тикеты + ДАННЫЕ ВЛАДЕЛЬЦА (кто пишет обращение): email, id, имя.
        // leftJoin: даже если пользователь удалён — тикет останется, owner будет null.
        const tickets = await ctx.db
            .select({
                ticket: supportTicket,
                owner: {
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    image: users.image,
                },
            })
            .from(supportTicket)
            .leftJoin(users, eq(supportTicket.userId, users.id));
        const rows = await ctx.db
            .select({ ticketId: supportMessage.ticketId, unread: count() })
            .from(supportMessage)
            .where(and(eq(supportMessage.isRead, false), ne(supportMessage.senderId, userId)))
            .groupBy(supportMessage.ticketId);
        // Когда было ПОСЛЕДНЕЕ сообщение в каждой заявке для сортивроки на верх
        const unreadByTicket = new Map(rows.map((r) => [r.ticketId, r.unread]));
        const lastRows = await ctx.db
            .select({ ticketId: supportMessage.ticketId, lastAt: max(supportMessage.createdAt) })
            .from(supportMessage)
            .groupBy(supportMessage.ticketId);
        // Словарь «id заявки → дата последнего сообщения»
        const lastByTicket = new Map(lastRows.map((r) => [r.ticketId, r.lastAt]));
        // Прячем ПУСТЫЕ заявки (без единого сообщения) из очереди админа:
        // раньше заявка создавалась уже при открытии окна — таких накопилось.
        // После ленивого создания (see openOrGetTicket / виджет) новых не будет;
        // старые не мозолят глаза. Напишет юзер в пустую — у неё появится
        // сообщение, и она тут же вернётся в очередь.
        const withMessages = tickets.filter((t) => lastByTicket.has(t.ticket.id));
        return withMessages
            .map((t) => ({
                // Разворачиваем поля самого тикета (id, status, createdAt...)
                ...t.ticket,
                // Кто написал обращение (для карточки в админке)
                owner: t.owner,
                unreadCount: unreadByTicket.get(t.ticket.id) ?? 0,
                lastActivity: lastByTicket.get(t.ticket.id) ?? t.ticket.createdAt,
            }))
            .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    }),
    assign: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
        if (!isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только для Администратора',
            });
        }
        const [updated] = await ctx.db
            .update(supportTicket)
            .set({ assignedToId: ctx.session.user.id })
            .where(eq(supportTicket.id, input.id))
            .returning();
        if (!updated) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Заявка не найдена',
            });
        }
        return updated;
    }),
});
