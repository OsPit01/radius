import { ADMIN_ROLES, isAdminRole } from "@/lib/constants/roles";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  supportMessage,
  supportTicket,
  users,
  notification,
} from "@/server/db/schema";
import { enforceRateLimit } from "@/server/rate-limit";
import { TRPCError } from "@trpc/server";
import { and, eq, asc, inArray } from "drizzle-orm";
import z from "zod";
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
      .where(
        and(eq(supportTicket.userId, userId), eq(supportTicket.status, "open")),
      );
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
  messages: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [target] = await ctx.db
        .select()
        .from(supportTicket)
        .where(eq(supportTicket.id, input.id));
      if (!target)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Заявка не найдена",
        });
      const isOwner = target.userId === userId;
      const isAdmin = isAdminRole(ctx.session.user.role);
      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к этой заявке",
        });
      }
      return ctx.db
        .select()
        .from(supportMessage)
        .where(eq(supportMessage.ticketId, input.id))
        .orderBy(asc(supportMessage.createdAt));
    }),
  send: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        text: z.string().trim().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      // Защита от флуда.
      await enforceRateLimit(
        ctx.db,
        `support:${userId}`,
        CHAT_RATE_LIMIT,
        CHAT_RATE_WINDOW_MS,
      );
      const [target] = await ctx.db
        .select()
        .from(supportTicket)
        .where(eq(supportTicket.id, input.id));
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      const isOwner = target.userId === userId;
      const isAdmin = isAdminRole(ctx.session.user.role);
      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к этой заявке",
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
      // Находим всех админов
      const admins = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.role, [...ADMIN_ROLES]));

      // Каждому админу — уведомление о новом сообщении
      for (const admin of admins) {
        await ctx.db.insert(notification).values({
          userId: admin.id,

          type: "support_new_message",
          title: "Новое сообшение в поддержку",
          text: `Пользователь написал в поддержку. Заявка #${input.id}`,
          link: "/admin/support",
        });
      }

      return created;
    }),
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db
      .select()
      .from(supportTicket)
      .where(eq(supportTicket.userId, userId));
  }),
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdminRole(ctx.session.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Только для администратора",
      });
    }
    return ctx.db.select().from(supportTicket);
  }),
  assign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminRole(ctx.session.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Только для Администратора",
        });
      }
      const [updated] = await ctx.db
        .update(supportTicket)
        .set({ assignedToId: ctx.session.user.id })
        .where(eq(supportTicket.id, input.id))
        .returning();
      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Заявка не найдена",
        });
      }
      return updated;
    }),
});
