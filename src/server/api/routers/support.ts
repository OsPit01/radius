import { TRPCError } from '@trpc/server';
import { and, asc, count, desc, eq, inArray, max, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import z from 'zod';

import { MAX_MESSAGE_LENGTH } from '@/lib/chat';
import { ADMIN_ROLES, hasPermission, isAdminRole } from '@/lib/constants/roles';
import { idSchema } from '@/lib/validation/common';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { supportMessage, supportTicket, users } from '@/server/db/schemas';
import { notifyMany, notifyUser } from '@/server/notify';
import { isUniqueViolation } from '@/server/pg-errors';
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
                    .returning({ id: supportTicket.id });
                return reopened;
            }
            // Клиенту нужен только id (для загрузки сообщений) — не отдаём userId/assignedToId.
            return { id: existing.id };
        }
        // Попытка создать заявку. Partial-уникальный индекс в БД
        // (support_ticket_open_user_unique) гарантирует «одна открытая заявка
        // на юзера»: при гонке двух параллельных вызовов второй получит 23505 —
        // перехватываем и возвращаем уже существующую заявку.
        try {
            const [created] = await ctx.db
                .insert(supportTicket)
                .values({
                    userId,
                })
                .returning({ id: supportTicket.id });
            return created;
        } catch (error) {
            if (!isUniqueViolation(error)) {
                throw error;
            }
            // Гонку выиграл параллельный вызов: берём заявку, которую создал он.
            const [won] = await ctx.db
                .select({ id: supportTicket.id })
                .from(supportTicket)
                .where(and(eq(supportTicket.userId, userId), eq(supportTicket.status, 'open')))
                .limit(1);
            if (!won) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
            }
            return { id: won.id };
        }
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

    messages: protectedProcedure.input(z.object({ id: idSchema })).query(async ({ ctx, input }) => {
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
                message: 'Обращение не найдено',
            });
        }
        const isOwner = ticket.userId === userId;
        const isAdmin = isAdminRole(ctx.session.user.role);
        if (!isOwner && !isAdmin) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Нет доступа к этому обращению',
            });
        }
        // Форма ответа прежняя ({ message, sender }) — клиенты не меняются.
        return (ticket.messages ?? []).map((m) => ({ message: m, sender: m.sender }));
    }),

    markRead: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
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
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Нет доступа к этому обращению' });
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
                id: idSchema,
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
                    message: 'Нет доступа к этому обращению',
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
                        message: 'Обращение закрыто',
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
                        message: 'Обращение ведет другой администратор',
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
                .returning({ id: supportMessage.id });
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
                // notifyMany: batch-вставка в БД + параллельная рассылка в телеграм
                // тем админам, у кого он подключён (см. src/server/notify.ts)
                if (admins.length > 0) {
                    await notifyMany(
                        ctx.db,
                        admins.map((admin) => ({
                            userId: admin.id,
                            type: 'support_new_message',
                            title: `Обращение в поддержку №${input.id}`,
                            text: 'Новое сообщение от пользователя',
                            link: '/admin/support',
                        })),
                    );
                }
            }

            // ===== Уведомляем ВЛАДЕЛЬЦА заявки — если написал АДМИН =====
            // Симметрия: пользователь написал → админам (блок выше),
            // админ ответил → пользователю (здесь). Без этой ветки человек
            // не узнавал об ответе НИ по одному каналу и должен был сам
            // заглядывать в чат поддержки — молчание выглядело как игнор.
            // isOwner-проверка: админ-владелец заявки не получает своё же сообщение.
            // link: прямой страницы обращения пока нет (задача Ч4) — ведём в профиль,
            // где висит виджет поддержки.
            if (isAdmin && !isOwner) {
                await notifyUser(ctx.db, {
                    userId: target.userId,
                    type: 'support_answer',
                    title: `Обращение в поддержку №${input.id}`,
                    text: 'Новый ответ от поддержки',
                    link: '/profile',
                });
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

            const limit = input.limit;
            const offset = input.cursor ?? 0;

            // НАСТОЯЩАЯ серверная пагинация (LIMIT/OFFSET прямо в SQL): раньше
            // в память грузились ВСЕ заявки и резались в JS — на тысячах тикетов
            // это упиралось в память и тормозило каждый запрос админки.
            //
            // lastMsg — подзапрос «последнее сообщение каждой заявки»: он нужен
            // и для сортировки «свежие сверху», и для отсева ПУСТЫХ заявок
            // (innerJoin ниже выкидывает заявки без единого сообщения — раньше
            // их прятал filter в JS). Сырые SQL-поля (max/count) обязаны иметь
            // явный .as(): иначе drizzle не даст сослаться на них снаружи.
            const lastMsg = ctx.db
                .select({
                    ticketId: supportMessage.ticketId,
                    lastAt: max(supportMessage.createdAt).as('lastAt'),
                })
                .from(supportMessage)
                .groupBy(supportMessage.ticketId)
                .as('last_msg');

            // unreadAgg — «непрочитанные, написанные не мной», по заявкам.
            const unreadAgg = ctx.db
                .select({
                    ticketId: supportMessage.ticketId,
                    unread: count().as('unread'),
                })
                .from(supportMessage)
                .where(and(eq(supportMessage.isRead, false), ne(supportMessage.senderId, userId)))
                .groupBy(supportMessage.ticketId)
                .as('unread');

            // limit + 1: лишняя строка — признак «есть следующая страница»,
            // чтобы не делать второй запрос только ради hasMore.
            const rows = await ctx.db
                .select({
                    ticket: supportTicket,
                    // Кто написал обращение. leftJoin: даже если пользователь
                    // удалён — тикет останется, owner будет null.
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
                    // Прямая ссылка на поле подзапроса (НЕ через sql-шаблон:
                    // drizzle запрещает сырые SQL-поля подзапроса внутри других
                    // шаблонов). count() в drizzle маппится в number, при
                    // leftJoin без строк — null, заменяем на 0 в JS ниже.
                    unreadCount: unreadAgg.unread,
                    lastActivity: lastMsg.lastAt,
                })
                .from(supportTicket)
                .leftJoin(users, eq(supportTicket.userId, users.id))
                .leftJoin(assignedAdminUser, eq(supportTicket.assignedToId, assignedAdminUser.id))
                .innerJoin(lastMsg, eq(lastMsg.ticketId, supportTicket.id))
                .leftJoin(unreadAgg, eq(unreadAgg.ticketId, supportTicket.id))
                .orderBy(desc(lastMsg.lastAt))
                .limit(limit + 1)
                .offset(offset);

            const hasMore = rows.length > limit;
            const items = rows.slice(0, limit).map((r) => ({
                // Разворачиваем поля самого тикета (id, status, createdAt...)
                ...r.ticket,
                owner: r.owner,
                assignedAdmin: r.assignedAdmin,
                unreadCount: r.unreadCount ?? 0,
                lastActivity: r.lastActivity,
            }));

            // nextCursor = null — всё показали, грузить больше нечего.
            return { items, nextCursor: hasMore ? offset + limit : null };
        }),
    assign: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
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
                message: 'Обращение не найдено',
            });
        }
        // Закрытую заявку брать в работу нельзя — она уже решена.
        if (target.status !== 'open') {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Обращение закрыто',
            });
        }
        // Если заявку уже ведёт другой админ — перехватывать её нельзя.
        if (target.assignedToId !== null && target.assignedToId !== ctx.session.user.id) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Обращение ведёт другой администратор',
            });
        }
        const [updated] = await ctx.db
            .update(supportTicket)
            .set({ assignedToId: ctx.session.user.id })
            .where(eq(supportTicket.id, input.id))
            .returning({ id: supportTicket.id });
        if (!updated) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Обращение не найдено',
            });
        }
        return updated;
    }),

    leave: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
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
            .returning({ id: supportTicket.id });
        if (!updated) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Вы не ведёте это обращение',
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
    close: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
        if (!isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Только для Администратора' });
        }
        const [target] = await ctx.db.select().from(supportTicket).where(eq(supportTicket.id, input.id));
        if (!target) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Обращение не найдено' });
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
            .returning({ id: supportTicket.id });
        // Уведомляем владельца: его обращение закрыто.
        // Структура уведомления: субъект в title, действие в text.
        // link появится вместе со страницей «Мои обращения» (Ч4) —
        // пока ссылки нет, оставляем без неё, чтобы не вести на 404.
        // notifyUser = колокольчик + телеграм, если подключён
        await notifyUser(ctx.db, {
            userId: target.userId,
            type: 'support_closed',
            title: `Обращение в поддержку №${input.id}`,
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
    delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
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
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Обращение не найдено' });
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
        .input(z.object({ id: idSchema, adminId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!isAdminRole(ctx.session.user.role)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Только для Администратора' });
            }
            // Закрытую заявку передавать бессмысленно — она уже решена.
            const [target] = await ctx.db.select().from(supportTicket).where(eq(supportTicket.id, input.id));
            if (!target) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Обращение не найдено' });
            }
            if (target.status !== 'open') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Обращение закрыто' });
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
                .returning({ id: supportTicket.id });
            if (!updated) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Обращение не найдено' });
            }
            // Сигнал новому ведущему: заявку передали именно ему.
            // Имя передавшего — firstName (без фамилии), иначе name.
            // notifyUser = колокольчик + телеграм, если подключён
            await notifyUser(ctx.db, {
                userId: input.adminId,
                type: 'support_assigned',
                title: `Обращение в поддержку №${input.id}`,
                text: `Вам её передал ${ctx.session.user.firstName ?? ctx.session.user.name ?? 'администратор'}`,
                link: '/admin/support',
            });

            return updated;
        }),
});
