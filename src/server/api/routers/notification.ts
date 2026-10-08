import { notification } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { count, and, eq, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { isAdminRole } from "@/lib/constants/roles";

export const notificationRouter = createTRPCRouter({
  getUnreadCount: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db
      .select({ count: count() })
      .from(notification)
      .where(
        and(eq(notification.userId, userId), eq(notification.isRead, false)),
      )

      .then((rows) => rows[0]?.count ?? 0);
  }),

  getMyNotifications: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db
      .select()
      .from(notification)
      .where(eq(notification.userId, userId))
      .orderBy(asc(notification.isRead), desc(notification.createdAt));
  }),
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [existing] = await ctx.db
        .select()
        .from(notification)
        .where(eq(notification.id, input.id));
      if (!existing)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Уведомление не найдено",
        });
      if (existing.userId !== userId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Это уведомление принадлежит другому пользователю",
        });
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
      .where(
        and(eq(notification.userId, userId), eq(notification.isRead, false)),
      );
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
          code: "FORBIDDEN",
          message: "Только администратор может уведомлять пользователей",
        });
      }

      await ctx.db.insert(notification).values({
        userId: input.userId,
        type: "admin_message",
        title: input.title,
        text: input.text,
        link: "/profile",
      });
      return { ok: true };
    }),
});
