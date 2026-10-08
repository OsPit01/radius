import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  siteVisit,
  apartmentView,
  apartments,
  favorites,
  booking,
} from "@/server/db/schema";
import { eq, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { isAdminRole } from "@/lib/constants/roles";

export const analyticsRouter = createTRPCRouter({
  // Уникальный переход на сайт. Один браузер = одна запись (первичный ключ
  // visitorId + onConflictDoNothing), повторные заходы не учитываются.
  trackSiteVisit: publicProcedure
    .input(z.object({ visitorId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(siteVisit)
        .values({ visitorId: input.visitorId })
        .onConflictDoNothing();
      return { ok: true };
    }),

  // Уникальный просмотр квартиры: один браузер = один просмотр конкретной
  // квартиры (составной первичный ключ visitorId + apartmentId).
  trackApartmentView: publicProcedure
    .input(
      z.object({
        visitorId: z.string().uuid(),
        apartmentId: z.number().int(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(apartmentView)
        .values({
          visitorId: input.visitorId,
          apartmentId: input.apartmentId,
        })
        .onConflictDoNothing();
      return { ok: true };
    }),

  // Статистика по квартирам текущего арендодателя.
  getMyApartmentStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Просмотры каждой квартиры владельца (leftJoin — квартиры без просмотров
    // тоже попадают в список, у них views = 0).
    const views = await ctx.db
      .select({
        apartmentId: apartments.id,
        title: apartments.title,
        views: count(apartmentView.apartmentId),
      })
      .from(apartments)
      .leftJoin(apartmentView, eq(apartmentView.apartmentId, apartments.id))
      .where(eq(apartments.createdById, userId))
      .groupBy(apartments.id, apartments.title);

    // Заявки на бронь квартир владельца.
    const [bookingsCount] = await ctx.db
      .select({ count: count() })
      .from(booking)
      .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
      .where(eq(apartments.createdById, userId));

    // Сколько раз квартиры владельца добавляли в избранное.
    const [favoritesCount] = await ctx.db
      .select({ count: count() })
      .from(favorites)
      .innerJoin(apartments, eq(favorites.apartmentId, apartments.id))
      .where(eq(apartments.createdById, userId));

    const totalViews = views.reduce((sum, v) => sum + v.views, 0);

    return {
      totalViews,
      totalBookings: bookingsCount?.count ?? 0,
      totalFavorites: favoritesCount?.count ?? 0,
      perApartment: views,
    };
  }),

  // Общая посещаемость сайта (уникальные переходы) — только для админа.
  getSiteStats: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdminRole(ctx.session.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Только для администратора",
      });
    }

    const [visits] = await ctx.db
      .select({ count: count() })
      .from(siteVisit);

    return { totalVisits: visits?.count ?? 0 };
  }),
});
