import { notification } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { count, and, eq, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

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
        .where(eq(notification.userId, userId));
      if (!existing)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "не существует",
        });
      if (!existing.userId)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "такого пользователя не удалось найти",
        });
      if (!existing.isRead)
        throw new TRPCError({ code: "FORBIDDEN", message: "" });
      return ctx.db
        .update(notification)
        .set({ isRead: true })
        .where(eq(notification.id, input.id));
    }),
});
