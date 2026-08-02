import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { users, apartments } from "@/server/db/schema";
import { eq, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { isAdminRole, ROLE_VALUES } from "@/lib/constants/roles";

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
          email: users.email,
          image: users.image,
          role: users.role,
          emailVerified: users.emailVerified,
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
      const userRole = ctx.session.user?.role;
      if (!isAdminRole(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на изменение ролей",
        });
      }
      // ===== ЗАЩИТА ОТ ИЗМЕНЕНИЯ ГЛАВНОГО АДМИНА =====
      const [targetUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.userId));
      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Пользователь не найден",
        });
      }

      if (targetUser.role === "mainadmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нельзя изменить роль этого пользователя",
        });
      }
      // ===== СУПЕР АДМИН =====
      if (userRole === "superadmin") {
        // Супер админ может менять любую роль, кроме mainadmin
        const [updated] = await ctx.db
          .update(users)
          .set({ role: input.role })
          .where(eq(users.id, input.userId))
          .returning();
        return updated;
      }
      const targetRole = targetUser.role;
      const currentRole = String(userRole);
      // ===== ОБЫЧНЫЙ АДМИН НЕ МОЖЕТ МЕНЯТЬ СУПЕР АДМИНА =====
      if (targetRole === "superadmin" && currentRole !== "superadmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Вы не можете изменять роль супер администратора",
        });
      }
      // ===== ОБНОВЛЯЕМ РОЛЬ (ДЛЯ ОБЫЧНЫХ АДМИНОВ) =====
      const [updated] = await ctx.db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId))
        .returning();

      return updated;
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

      return {
        user,
        stats: {
          totalApartments: apartmentsCount?.count ?? 0, // TODO: подсчёт из apartments
          totalBookings: 0, // TODO: подсчёт из bookings
          totalFavorites: 0, // TODO: подсчёт из favorites
        },
      };
    }),

  // 5. Обновить профиль пользователя
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [updated] = await ctx.db
        .update(users)
        .set({
          name: input.name,
          image: input.image,
        })
        .where(eq(users.id, userId))
        .returning();

      return updated;
    }),
});
