import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { apartmentCardColumns } from '@/server/apartment-selects';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { apartments, favorites } from '@/server/db/schema';

const apartmentIdInput = z.object({
    apartmentId: z.number().int().positive('Некорректный идентификатор объекта'),
});

export const favoritesRouter = createTRPCRouter({
    listIds: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const rows = await ctx.db
            .select({ apartmentId: favorites.apartmentId })
            .from(favorites)
            .where(eq(favorites.userId, userId));
        return rows.map((r) => r.apartmentId);
    }),

    toggle: protectedProcedure.input(apartmentIdInput).mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        // 1. Проверяем если уже такая запись?
        const [existing] = await ctx.db
            .select()
            .from(favorites)
            .where(and(eq(favorites.userId, userId), eq(favorites.apartmentId, input.apartmentId)));
        // 2. Есть → удаляем (убрали из избранного)
        if (existing) {
            await ctx.db
                .delete(favorites)
                .where(and(eq(favorites.userId, userId), eq(favorites.apartmentId, input.apartmentId)));
            return { isFavorite: false };
        }
        // 3. Нет → добавляем (добавили в избранное)
        await ctx.db.insert(favorites).values({ userId, apartmentId: input.apartmentId });
        return { isFavorite: true };
    }),
    //4. эта квартира у пользователя в избранном или нет?
    isFavorite: protectedProcedure.input(apartmentIdInput).query(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        const [existing] = await ctx.db
            .select()
            .from(favorites)
            .where(and(eq(favorites.userId, userId), eq(favorites.apartmentId, input.apartmentId)));
        return { isFavorite: !!existing };
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        // Отдаём только публичные поля карточки и только опубликованные объекты:
        // скрытая/снятая с модерации квартира не должна «протекать» через избранное.
        return await ctx.db
            .select(apartmentCardColumns)
            .from(favorites)
            .innerJoin(apartments, eq(favorites.apartmentId, apartments.id))
            .where(and(eq(favorites.userId, userId), eq(apartments.status, 'active')));
    }),
});
