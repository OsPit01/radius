import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { users, apartments, favorites } from "@/server/db/schema";
import { eq, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getRoleInfo, isAdminRole, ROLE_VALUES } from "@/lib/constants/roles";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/server/db/schema";

type Database = PostgresJsDatabase<typeof schema>;

// Общая проверка прав для админ-действий над чужим пользователем:
// 1) только админ, 2) не себя, 3) юзер существует, 4) уровень цели строго ниже моего.
// Возвращает целевого пользователя.
async function requireTargetUser(
  db: Database,
  myRole: string,
  myId: string,
  targetId: string,
) {
  if (!isAdminRole(myRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "У вас нет прав на это действие",
    });
  }
  if (targetId === myId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Нельзя изменить самого себя",
    });
  }
  const [target] = await db.select().from(users).where(eq(users.id, targetId));
  if (!target) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Пользователь не найден",
    });
  }
  if (getRoleInfo(myRole).level <= getRoleInfo(target.role).level) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Нельзя изменить пользователя с таким же или более высоким уровнем",
    });
  }
  return target;
}

// =====
// 1. ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (ТОЛЬКО ДЛЯ АДМИНА)
// =====
export const userRouter = createTRPCRouter({
  // 1. Получить всех пользователей (админка)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Проверка: только админы могут видеть всех пользователей
    const userRole = ctx.session.user?.role;

    if (!isAdminRole(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "У вас нет прав на просмотр всех пользователей",
      });
    }
    return await ctx.db.select().from(users);
  }),
  // 2. Получить одного пользователя по ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
          patronymic: users.patronymic,
          email: users.email,
          image: users.image,
          role: users.role,
          emailVerified: users.emailVerified,
          totalBookings: users?.totalBookings,
          totalFavorites: users?.totalFavorites,
        })
        .from(users)
        .where(eq(users.id, input.id));
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Пользователь не найден",
        });
      }
      return user;
    }),
  // 3. Обновить роль пользователя (только для админа)

  updateRole: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(ROLE_VALUES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireTargetUser(
        ctx.db,
        ctx.session.user.role,
        ctx.session.user.id,
        input.userId,
      );

      const newLevel = getRoleInfo(input.role).level;
      if (newLevel >= getRoleInfo(ctx.session.user.role).level) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нельзя назначить роль выше вашей",
        });
      }

      const [updatedUser] = await ctx.db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId))
        .returning();
      return updatedUser;
    }),

  // 4. Получить статистику пользователя (кол-во объектов, бронирований и т.д.)
  getStats: protectedProcedure
    .input(z.object({ userId: z.string() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = input?.userId ?? ctx.session.user.id;

      // Проверяем, что пользователь смотрит свою статистику или он админ
      if (userId !== ctx.session.user.id) {
        const userRole = ctx.session.user?.role;
        if (!isAdminRole(userRole)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "У вас нет прав на просмотр чужой статистики",
          });
        }
      }

      // TODO: добавить подсчёт бронирований и избранного, когда появятся соответствующие таблицы
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      const [apartmentsCount] = await ctx.db
        .select({ count: count() })
        .from(apartments)
        .where(eq(apartments.createdById, userId));

      const [favoritesCount] = await ctx.db
        .select({ count: count() })
        .from(favorites)
        .where(eq(favorites.userId, userId));

      return {
        user,
        stats: {
          totalApartments: apartmentsCount?.count ?? 0, // TODO: подсчёт из apartments
          totalBookings: 0, // TODO: подсчёт из bookings
          totalFavorites: favoritesCount?.count ?? 0, // TODO: подсчёт из favorites
        },
      };
    }),

  // 5. Обновить профиль пользователя
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().optional(),
        phone: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        patronymic: z.string().optional(),
        totalBookings: z.number().optional(),
        totalFavorites: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [updated] = await ctx.db
        .update(users)
        .set({
          name: input.name,
          image: input.image,
          phone: input.phone,
          firstName: input.firstName,
          lastName: input.lastName,
          patronymic: input.patronymic,
          totalBookings: input.totalBookings,
          totalFavorites: input.totalFavorites,
        })
        .where(eq(users.id, userId))
        .returning();

      return updated;
    }),
  //ЛОГИКА ДЛЯ ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЕЙ СО СТОРОНЫ АДМИНА
  adminUpdateUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        patronymic: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireTargetUser(
        ctx.db,
        ctx.session.user.role,
        ctx.session.user.id,
        input.userId,
      );

      const [updatedUser] = await ctx.db
        .update(users)
        .set({
          firstName: input.firstName ?? undefined,
          lastName: input.lastName ?? undefined,
          patronymic: input.patronymic ?? undefined,
          email: input.email ?? undefined,
          phone: input.phone ?? undefined,
        })
        .where(eq(users.id, input.userId))
        .returning();
      return updatedUser;
    }),

  // 6. Забанить пользователя на N дней
  banUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        days: z.number().int().min(1).max(3650),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireTargetUser(
        ctx.db,
        ctx.session.user.role,
        ctx.session.user.id,
        input.userId,
      );

      const [updated] = await ctx.db
        .update(users)
        .set({ bannedUntil: new Date(Date.now() + input.days * 86_400_000) })
        .where(eq(users.id, input.userId))
        .returning();
      return updated;
    }),

  // 7. Разбанить пользователя
  unbanUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireTargetUser(
        ctx.db,
        ctx.session.user.role,
        ctx.session.user.id,
        input.userId,
      );

      const [updated] = await ctx.db
        .update(users)
        .set({ bannedUntil: null })
        .where(eq(users.id, input.userId))
        .returning();
      return updated;
    }),
});
