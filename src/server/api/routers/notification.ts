import { TRPCError } from '@trpc/server';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { getNotificationLink } from '@/lib/constants/notification';
import { isAdminRole } from '@/lib/constants/roles';
import { idSchema } from '@/lib/validation/common';
import { apartments, notification, users } from '@/server/db/schemas';
import { notifyUser } from '@/server/notify';

import { createTRPCRouter, protectedProcedure } from '../trpc';

export const notificationRouter = createTRPCRouter({
    getUnreadCount: protectedProcedure.query(({ ctx }) => {
        const userId = ctx.session.user.id;
        return ctx.db
            .select({ count: count() })
            .from(notification)
            .where(and(eq(notification.userId, userId), eq(notification.isRead, false)))

            .then((rows) => rows[0]?.count ?? 0);
    }),

    getMyNotifications: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // LEFT JOIN нужен, чтобы для каждого уведомления узнать владельца объекта.
        // Это позволяет отличить «гость» от «арендодателя» даже у события
        // booking_expired, которое уходит обеим сторонам.
        const rows = await ctx.db
            .select({
                notification,
                apartmentOwnerId: apartments.createdById,
            })
            .from(notification)
            .leftJoin(apartments, eq(notification.apartmentId, apartments.id))
            .where(eq(notification.userId, userId))
            .orderBy(asc(notification.isRead), desc(notification.createdAt));

        // Пересчитываем ссылку НА ЧТЕНИИ. Старые записи в базе хранят устаревшие
        // пути ('/profile/bookings' или '/profile/my-bookings' у владельца) —
        // без этого шага исправление кода не трогало уже сохранённые уведомления.
        return rows.map(({ notification: item, apartmentOwnerId }) => ({
            ...item,
            link: getNotificationLink(item.type, item.link, apartmentOwnerId === userId),
        }));
    }),
    markAsRead: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        const [existing] = await ctx.db.select().from(notification).where(eq(notification.id, input.id));
        if (!existing) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Уведомление не найдено',
            });
        }
        if (existing.userId !== userId) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Это уведомление принадлежит другому пользователю',
            });
        }
        return ctx.db
            .update(notification)
            .set({ isRead: true, readAt: new Date() })
            .where(eq(notification.id, input.id));
    }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        await ctx.db
            .update(notification)
            .set({ isRead: true, readAt: new Date() })
            .where(and(eq(notification.userId, userId), eq(notification.isRead, false)));
    }),

    // Удалить ОДНО своё уведомление. Где userId = мой И id = указанный:
    // чужое уведомление удалить нельзя — условие просто не совпадёт.
    delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        const [deleted] = await ctx.db
            .delete(notification)
            .where(and(eq(notification.id, input.id), eq(notification.userId, userId)))
            .returning({ id: notification.id });
        if (!deleted) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Уведомление не найдено' });
        }
        return { ok: true };
    }),

    // Очистить ВСЕ свои уведомления (кнопка «Удалить все» на странице).
    deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
        await ctx.db.delete(notification).where(eq(notification.userId, ctx.session.user.id));
        return { ok: true };
    }),

    // Админ пишет пользователю — сообщение приходит в уведомления, не в чат.
    notifyUser: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                title: z.string().trim().min(1).max(255),
                text: z.string().trim().min(1).max(2000),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            if (!isAdminRole(ctx.session.user.role)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Только администратор может уведомлять пользователей',
                });
            }

            // Граница доверия: userId должен быть РЕАЛЬНЫМ пользователем —
            // иначе INSERT упал бы с FK-violation и клиент получил бы 500
            // вместо понятной ошибки.
            const [target] = await ctx.db.select({ id: users.id }).from(users).where(eq(users.id, input.userId));
            if (!target) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Пользователь не найден' });
            }

            // notifyUser (хелпер) = колокольчик в БД + дублирование в телеграм.
            // ВАЖНО: это роутер называется notifyUser, а внутри зовём хелпер
            // с тем же именем из '@/server/notify' — не путать.
            await notifyUser(ctx.db, {
                userId: input.userId,
                type: 'admin_message',
                title: input.title,
                text: input.text,
                link: '/profile',
            });
            return { ok: true };
        }),
});
