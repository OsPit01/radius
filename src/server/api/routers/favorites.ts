import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { favorites } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const favoritesRouter = createTRPCRouter({
  listIds: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const rows = await ctx.db
      .select({ apartmentId: favorites.apartmentId })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    return rows.map((r) => r.apartmentId);
  }),

  toggle: protectedProcedure
    .input(z.object({ apartmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      // 1. Проверяем если уже такая запись?
      const [existing] = await ctx.db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, userId),
            eq(favorites.apartmentId, input.apartmentId),
          ),
        );
      // 2. Есть → удаляем (убрали из избранного)
      if (existing) {
        await ctx.db
          .delete(favorites)
          .where(
            and(
              eq(favorites.userId, userId),
              eq(favorites.apartmentId, input.apartmentId),
            ),
          );
        return { isFavorite: false };
      }
      // 3. Нет → добавляем (добавили в избранное)
      await ctx.db
        .insert(favorites)
        .values({ userId, apartmentId: input.apartmentId });
      return { isFavorite: true };
    }),
  //4. эта квартира у пользователя в избранном или нет?
  isFavorite: protectedProcedure
    .input(z.object({ apartmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [existing] = await ctx.db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, userId),
            eq(favorites.apartmentId, input.apartmentId),
          ),
        );
      return { isFavorite: !!existing };
    }),
});
