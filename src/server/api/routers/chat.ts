import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { conversation, message, users } from "@/server/db/schema";
import { or, eq, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import z from "zod";
import { TRPCError } from "@trpc/server";

// Таблица users присоединяется к диалогу ДВА раза (гость и владелец),
// поэтому создаём два «псевдонима» одной таблицы.
const guestUser = alias(users, "guest");
const ownerUser = alias(users, "owner");
export const chatRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db
      .select({
        conversation: conversation,
        guest: {
          id: guestUser.id,
          name: guestUser.name,
          firstName: guestUser.firstName,
          lastName: guestUser.lastName,
          image: guestUser.image,
        },
        owner: {
          id: ownerUser.id,
          name: ownerUser.name,
          firstName: ownerUser.firstName,
          lastName: ownerUser.lastName,
          image: ownerUser.image,
        },
      })
      .from(conversation)
      .leftJoin(guestUser, eq(conversation.guestId, guestUser.id))
      .leftJoin(ownerUser, eq(conversation.ownerId, ownerUser.id))
      .where(
        or(eq(conversation.guestId, userId), eq(conversation.ownerId, userId)),
      );
  }),
  message: protectedProcedure

    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [target] = await ctx.db
        .select()
        .from(conversation)
        .where(eq(conversation.id, input.conversationId));
      if (!target)
        throw new TRPCError({ code: "NOT_FOUND", message: "Диалог не найден" });
      const userId = ctx.session.user.id;
      const isParticipant =
        target.guestId === userId || target.ownerId === userId;

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к этому чату",
        });
      }
      return ctx.db
        .select()
        .from(message)
        .where(eq(message.conversationId, input.conversationId))
        .orderBy(asc(message.createdAt));
    }),
  send: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        text: z.string().trim().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [target] = await ctx.db
        .select()
        .from(conversation)
        .where(eq(conversation.id, input.conversationId));
      if (!target)
        throw new TRPCError({ code: "NOT_FOUND", message: "Диалог не найден" });
      const userId = ctx.session.user.id;
      const isParticipant =
        target.guestId === userId || target.ownerId === userId;

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к этому чату",
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
