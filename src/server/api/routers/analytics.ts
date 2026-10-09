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
  users,
} from "@/server/db/schema";
import { eq, count, inArray } from "drizzle-orm";
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

  // Статистика по КАЖДОЙ квартире текущего арендодателя:
  // просмотры, добавления в избранное и бронирования — отдельно по объектам.
  getMyApartmentStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Мои квартиры (id + название).
    const myApartments = await ctx.db
      .select({ id: apartments.id, title: apartments.title })
      .from(apartments)
      .where(eq(apartments.createdById, userId));
    const myIds = myApartments.map((a) => a.id);

    // Нет объектов — нечего считать.
    if (myIds.length === 0) {
      return {
        totalViews: 0,
        totalBookings: 0,
        totalFavorites: 0,
        perApartment: [],
      };
    }

    // Счётчики считаем ТРЕМЯ отдельными запросами (а не одним с несколькими
    // join) — иначе из-за «декартова» умножения строк цифры бы задвоились.
    const viewsRows = await ctx.db
      .select({ apartmentId: apartmentView.apartmentId, value: count() })
      .from(apartmentView)
      .where(inArray(apartmentView.apartmentId, myIds))
      .groupBy(apartmentView.apartmentId);

    const favoritesRows = await ctx.db
      .select({ apartmentId: favorites.apartmentId, value: count() })
      .from(favorites)
      .where(inArray(favorites.apartmentId, myIds))
      .groupBy(favorites.apartmentId);

    const bookingsRows = await ctx.db
      .select({ apartmentId: booking.apartmentId, value: count() })
      .from(booking)
      .where(inArray(booking.apartmentId, myIds))
      .groupBy(booking.apartmentId);

    // Сводим в Map, чтобы быстро искать по id квартиры.
    const toMap = (rows: { apartmentId: number; value: number }[]) =>
      new Map(rows.map((r) => [r.apartmentId, r.value]));
    const viewsMap = toMap(viewsRows);
    const favoritesMap = toMap(favoritesRows);
    const bookingsMap = toMap(bookingsRows);

    // Собираем итог: каждая квартира + все три её показателя.
    const perApartment = myApartments.map((a) => ({
      apartmentId: a.id,
      title: a.title,
      views: viewsMap.get(a.id) ?? 0,
      favorites: favoritesMap.get(a.id) ?? 0,
      bookings: bookingsMap.get(a.id) ?? 0,
    }));

    const totalViews = perApartment.reduce((s, a) => s + a.views, 0);
    const totalFavorites = perApartment.reduce((s, a) => s + a.favorites, 0);
    const totalBookings = perApartment.reduce((s, a) => s + a.bookings, 0);

    return { totalViews, totalBookings, totalFavorites, perApartment };
  }),

  // Общая статистика по всему сайту — только для админа.
  // Максимально полная: пользователи, квартиры и брони по статусам,
  // просмотры, избранное и конверсия.
  getSiteStats: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdminRole(ctx.session.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Только для администратора",
      });
    }

    // Общие счётчики по таблицам.
    const [visits] = await ctx.db.select({ count: count() }).from(siteVisit);
    const [usersCount] = await ctx.db.select({ count: count() }).from(users);
    const [apartmentsCount] = await ctx.db
      .select({ count: count() })
      .from(apartments);
    const [bookingsCount] = await ctx.db.select({ count: count() }).from(booking);
    const [viewsCount] = await ctx.db
      .select({ count: count() })
      .from(apartmentView);
    const [favoritesCount] = await ctx.db
      .select({ count: count() })
      .from(favorites);

    // Квартиры по статусам (active / moderation / rejected).
    const apartmentStatusRows = await ctx.db
      .select({ status: apartments.status, value: count() })
      .from(apartments)
      .groupBy(apartments.status);

    // Брони по статусам (new / approved / rejected / cancelled / expired).
    const bookingStatusRows = await ctx.db
      .select({ status: booking.status, value: count() })
      .from(booking)
      .groupBy(booking.status);

    const totalViews = viewsCount?.count ?? 0;
    const totalBookings = bookingsCount?.count ?? 0;
    const totalFavorites = favoritesCount?.count ?? 0;

    // Конверсии (в %): сколько броней/избранного приходится на один просмотр.
    const conversionViewToBooking =
      totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;
    const conversionViewToFavorite =
      totalViews > 0 ? (totalFavorites / totalViews) * 100 : 0;

    return {
      totalVisits: visits?.count ?? 0,
      totalUsers: usersCount?.count ?? 0,
      totalApartments: apartmentsCount?.count ?? 0,
      totalBookings,
      totalViews,
      totalFavorites,
      conversionViewToBooking: Math.round(conversionViewToBooking * 10) / 10,
      conversionViewToFavorite: Math.round(conversionViewToFavorite * 10) / 10,
      apartmentsByStatus: apartmentStatusRows.map((r) => ({
        status: r.status,
        count: r.value,
      })),
      bookingsByStatus: bookingStatusRows.map((r) => ({
        status: r.status,
        count: r.value,
      })),
    };
  }),
});
