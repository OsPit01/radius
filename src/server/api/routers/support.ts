import { TRPCError } from '@trpc/server';
import { and, asc, count, desc, eq, inArray, max, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import z from 'zod';

import { MAX_MESSAGE_LENGTH } from '@/lib/chat';
import { ADMIN_ROLES, hasPermission, isAdminRole } from '@/lib/constants/roles';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { notification, supportMessage, supportTicket, users } from '@/server/db/schemas';
import { enforceRateLimit } from '@/server/rate-limit';
// Антифлуд: сколько сообщений может отправить один пользователь за окно времени.
const CHAT_RATE_LIMIT = 30;
const CHAT_RATE_WINDOW_MS = 60 * 1000;
const assignedAdminUser = alias(users, 'assigned_admin');
export const supportRouter = createTRPCRouter({
    openOrGetTicket: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // ОДНА непрерывная беседа на пользователя: ищем его ПОСЛЕДНЮЮ заявку
        // (любого статуса). Закрыта? Переоткрываем — диалог продолжается
        // в той же заявке, а не плодит новую. Новой заявка будет только
        // у того, кто ещё никогда не обращался в поддержку.
        const [existing] = await ctx.db
            .select()
            .from(supportTicket)
            .where(eq(supportTicket.userId, userId))
            .orderBy(desc(supportTicket.createdAt))
            .limit(1);
        if (existing) {
            if (existing.status !== 'open') {
                const [reopened] = await ctx.db
                    .update(supportTicket)
                    .set({ status: 'open' })
                    .where(eq(supportTicket.id, existing.id))
                    .returning();
                return reopened;
            }
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
    // myTicket — «подглядывание»: вернуть ПОСЛЕДНЮЮ заявку юзера
    // (любого статуса), но НЕ СОЗДАВАТЬ новую. Виджет вызывает это
    // при открытии окна: был разговор — подгрузить его и статус
    // (открыта/закрыта) + кто из админов ведёт; не было — null.
    // Возвращает { id, status, assignedAdmin } или null.
    // ============================================================
    myTicket: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        // findFirst: первая подходящая строка или undefined. leftJoin и alias
        // больше не нужны — связь assignedAdmin описана в relations.ts.
        const ticket = await ctx.db.query.supportTicket.findFirst({
            // Табу «не отдавать лишнего»: из заявки клиенту нужны только id и статус.
            columns: { id: true, status: true },
            where: eq(supportTicket.userId, userId),
            orderBy: desc(supportTicket.createdAt),
            // «Вместе с» ведущим админом — только имя, firstName и email.
            with: {
                assignedAdmin: { columns: { name: true, firstName: true, email: true } },
            },
        });
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
        // Один запрос вместо двух: заявка + проверка доступа + её сообщения
        // с отправителями — всё через связи из relations.ts (leftJoin руками не нужен).
        const ticket = await ctx.db.query.supportTicket.findFirst({
            columns: { id: true, userId: true },
            where: eq(supportTicket.id, input.id),
            with: {
                messages: {
                    orderBy: asc(supportMessage.createdAt),
                    with: {
                        sender: {
                            columns: { id: true, name: true, firstName: true, lastName: true, image: true },
                        },
                    },
                },
            },
        });
        if (!ticket) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Заявка не найдена',
            });
        }
        const isOwner = ticket.userId === userId;
        const isAdmin = isAdminRole(ctx.session.user.role);
        if (!isOwner && !isAdmin) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Нет доступа к этой заявке',
            });
        }
        // Форма ответа прежняя ({ message, sender }) — клиенты не меняются.
        return (ticket.messages ?? []).map((m) => ({ message: m, sender: m.sender }));
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
            // В закрытую заявку писать нельзя — админу. А вот ВЛАДЕЛЕЦ
            // закрытую ПЕРЕОТКРЫВАЕТ: беседа у пользователя одна,
            // новое сообщение продолжает её в той же заявке.
            if (target.status !== 'open') {
                if (isOwner) {
                    await ctx.db.update(supportTicket).set({ status: 'open' }).where(eq(supportTicket.id, input.id));
                } else {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Заявка закрыта',
                    });
                }
            }
            if (isAdmin && !isOwner) {
                if (target.assignedToId === null) {
                    await ctx.db
                        .update(supportTicket)
                        .set({ assignedToId: userId })
                        .where(eq(supportTicket.id, input.id));
                } else if (target.assignedToId !== userId) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Заявку ведет другой администратор',
                    });
                }
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
                            title: `Заявка #${input.id}`,
                            text: 'Новое сообщение от пользователя',
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
    listAll: protectedProcedure
        .input(
            z.object({
                // Пагинация НА СЕРВЕРЕ (табу «не отдавать лишнего»): клиент получает
                // только одну страницу, а не тысячу заявок разом.
                // limit — размер страницы, cursor — смещение (offset) для следующей.
                limit: z.number().int().min(1).max(100).default(50),
                cursor: z.number().int().min(0).nullish(),
            }),
        )
        .query(async ({ ctx, input }) => {
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
                        firstName: users.firstName,
                        email: users.email,
                        image: users.image,
                    },
                    assignedAdmin: {
                        id: assignedAdminUser.id,
                        name: assignedAdminUser.name,
                        firstName: assignedAdminUser.firstName,
                        image: assignedAdminUser.image,
                        // Роль ведущего (admin/superadmin/mainadmin) — для цветного бейджа статуса
                        role: assignedAdminUser.role,
                    },
                })
                .from(supportTicket)
                .leftJoin(users, eq(supportTicket.userId, users.id))
                .leftJoin(assignedAdminUser, eq(supportTicket.assignedToId, assignedAdminUser.id));
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
            const sorted = tickets
                .filter((t) => lastByTicket.has(t.ticket.id))
                .map((t) => ({
                    // Разворачиваем поля самого тикета (id, status, createdAt...)
                    ...t.ticket,
                    // Кто написал обращение (для карточки в админке)
                    owner: t.owner,
                    assignedAdmin: t.assignedAdmin,
                    unreadCount: unreadByTicket.get(t.ticket.id) ?? 0,
                    lastActivity: lastByTicket.get(t.ticket.id) ?? t.ticket.createdAt,
                }))
                .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
            // Страница: срез от cursor до cursor + limit. nextCursor = null —
            // всё показали, грузить больше нечего.
            const offset = input.cursor ?? 0;
            const nextCursor = offset + input.limit < sorted.length ? offset + input.limit : null;
            return {
                items: sorted.slice(offset, offset + input.limit),
                nextCursor,
            };
        }),
    assign: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
        if (!isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только для Администратора',
            });
        }
        const [target] = await ctx.db.select().from(supportTicket).where(eq(supportTicket.id, input.id));
        if (!target) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Заявка не найдена',
            });
        }
        // Закрытую заявку брать в работу нельзя — она уже решена.
        if (target.status !== 'open') {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Заявка закрыта',
            });
        }
        // Если заявку уже ведёт другой админ — перехватывать её нельзя.
        if (target.assignedToId !== null && target.assignedToId !== ctx.session.user.id) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Заявку ведёт другой администратор',
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

    leave: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
        if (!isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только для Администратора',
            });
        }
        const [updated] = await ctx.db
            .update(supportTicket)
            .set({
                assignedToId: null,
            })
            .where(and(eq(supportTicket.id, input.id), eq(supportTicket.assignedToId, ctx.session.user.id)))
            .returning();
        if (!updated) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Вы не ведёте эту заявку',
            });
        }
        return updated;
    }),
    // ============================================================
    // close — закрыть обращение. Вопрос решён, переписка закончена.
    // Закрыть может ведущий заявку админ; если никто не ведёт — любой админ.
    // После закрытия писать в заявку нельзя (см. проверку в send),
    // а пользователь при следующем обращении получит НОВУЮ заявку.
    // ============================================================
    close: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
        if (!isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Только для Администратора' });
        }
        const [target] = await ctx.db.select().from(supportTicket).where(eq(supportTicket.id, input.id));
        if (!target) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Заявка не найдена' });
        }
        // Если заявку ведёт другой админ — закрывать может только он.
        if (target.assignedToId !== null && target.assignedToId !== ctx.session.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Заявку ведёт другой администратор' });
        }
        const [updated] = await ctx.db
            .update(supportTicket)
            .set({
                status: 'closed',
                // Закрыли — значит никто больше не ведёт: админ не должен
                // оставаться «подключённым» к закрытому чату. Пользователь
                // напишет снова — заявка переоткроется БЕЗ ведущего, и любой
                // админ сможет взять её заново.
                assignedToId: null,
            })
            .where(eq(supportTicket.id, input.id))
            .returning();
        // Уведомляем владельца: его обращение закрыто.
        // Структура уведомления: субъект в title, действие в text.
        // link появится вместе со страницей «Мои обращения» (Ч4) —
        // пока ссылки нет, оставляем без неё, чтобы не вести на 404.
        await ctx.db.insert(notification).values({
            userId: target.userId,
            type: 'support_closed',
            title: `Заявка #${input.id}`,
            text: 'Закрыта службой поддержки',
        });
        return updated;
    }),
    // ============================================================
    // delete — удалить обращение ЦЕЛИКОМ: заявку и ВСЕ её сообщения.
    // Только superadmin/mainadmin (уровень >= superadmin): рядовой админ
    // не может замести следы переписки. Транзакция: либо удалилось всё
    // (сообщения + заявка), либо ничего — частичного состояния не бывает
    // (ошибка внутри — Drizzle откатит все операции).
    // ============================================================
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
        if (!hasPermission(ctx.session.user.role, 'superadmin')) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только супер админ или главный админ может удалять обращения',
            });
        }
        await ctx.db.transaction(async (tx) => {
            // 1. Сначала сообщения: FK supportMessage.ticketId ссылается
            //    на заявку — с «живыми» сообщениями заявку не удалить.
            await tx.delete(supportMessage).where(eq(supportMessage.ticketId, input.id));
            // 2. Потом саму заявку. returning — проверить, что она была.
            const [deleted] = await tx
                .delete(supportTicket)
                .where(eq(supportTicket.id, input.id))
                .returning({ id: supportTicket.id });
            if (!deleted) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Заявка не найдена' });
            }
        });
        return { ok: true };
    }),
    // Список админов для передачи заявки: только id и имя
    admins: protectedProcedure.query(async ({ ctx }) => {
        if (!isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Только для Администратора' });
        }
        return await ctx.db
            .select({ id: users.id, name: users.name, firstName: users.firstName, email: users.email })
            .from(users)
            .where(inArray(users.role, [...ADMIN_ROLES]));
    }),
    // Передать заявку другому админу.
    transfer: protectedProcedure
        .input(z.object({ id: z.number(), adminId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!isAdminRole(ctx.session.user.role)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Только для Администратора' });
            }
            // Закрытую заявку передавать бессмысленно — она уже решена.
            const [target] = await ctx.db.select().from(supportTicket).where(eq(supportTicket.id, input.id));
            if (!target) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Заявка не найдена' });
            }
            if (target.status !== 'open') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Заявка закрыта' });
            }
            // Граница доверия: adminId обязан быть реальным админом.
            const [targetAdmin] = await ctx.db
                .select({ id: users.id })
                .from(users)
                .where(and(eq(users.id, input.adminId), inArray(users.role, [...ADMIN_ROLES])));
            if (!targetAdmin) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Выбранный Пользователь не администратор' });
            }
            const [updated] = await ctx.db
                .update(supportTicket)
                .set({ assignedToId: input.adminId })
                .where(eq(supportTicket.id, input.id))
                .returning();
            if (!updated) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Заявка не найдена' });
            }
            // Сигнал новому ведущему: заявку передали именно ему.
            // Имя передавшего — firstName (без фамилии), иначе name.
            await ctx.db.insert(notification).values({
                userId: input.adminId,
                type: 'support_assigned',
                title: `Заявка #${input.id}`,
                text: `Вам её передал ${ctx.session.user.firstName ?? ctx.session.user.name ?? 'администратор'}`,
                link: '/admin/support',
            });

            return updated;
        }),
});
