import { TRPCError } from '@trpc/server';
import { count, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { z } from 'zod';

import { getRoleInfo, isAdminRole, ROLE_VALUES } from '@/lib/constants/roles';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import type * as schema from '@/server/db/schema';
import { apartments, booking, favorites, users } from '@/server/db/schema';

type Database = PostgresJsDatabase<typeof schema>;

// Общая проверка прав для админ-действий над чужим пользователем:
// 1) только админ, 2) не себя, 3) юзер существует, 4) уровень цели строго ниже моего.
// Возвращает целевого пользователя.
async function requireTargetUser(db: Database, myRole: string, myId: string, targetId: string) {
    if (!isAdminRole(myRole)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'У вас нет прав на это действие',
        });
    }
    if (targetId === myId) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Нельзя изменить самого себя',
        });
    }
    const [target] = await db.select().from(users).where(eq(users.id, targetId));
    if (!target) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Пользователь не найден',
        });
    }
    if (getRoleInfo(myRole).level <= getRoleInfo(target.role).level) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Нельзя изменить пользователя с таким же или более высоким уровнем',
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
                code: 'FORBIDDEN',
                message: 'У вас нет прав на просмотр всех пользователей',
            });
        }
        // Отдаём только то, что нужно админке. Служебные и приватные поля
        // (telegramChatId, telegramLinkCode, bannedUntil, emailVerified, счётчики)
        // в список не входят — им здесь не место.
        return await ctx.db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                firstName: users.firstName,
                lastName: users.lastName,
                patronymic: users.patronymic,
                image: users.image,
                role: users.role,
            })
            .from(users);
    }),
    // 2. Получить одного пользователя по ID
    getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        // Безопасность: личные данные доступны только самому пользователю
        // или администратору. Чужой id — запрещён.
        if (input.id !== ctx.session.user.id && !isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Нет доступа к данным другого пользователя',
            });
        }

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
                telegramChatId: users.telegramChatId,
            })
            .from(users)
            .where(eq(users.id, input.id));
        if (!user) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Пользователь не найден',
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
            await requireTargetUser(ctx.db, ctx.session.user.role, ctx.session.user.id, input.userId);

            const newLevel = getRoleInfo(input.role).level;
            if (newLevel >= getRoleInfo(ctx.session.user.role).level) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Нельзя назначить роль выше вашей',
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
    getStats: protectedProcedure.input(z.object({ userId: z.string() }).optional()).query(async ({ ctx, input }) => {
        const userId = input?.userId ?? ctx.session.user.id;

        // Проверяем, что пользователь смотрит свою статистику или он админ
        if (userId !== ctx.session.user.id) {
            const userRole = ctx.session.user?.role;
            if (!isAdminRole(userRole)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'У вас нет прав на просмотр чужой статистики',
                });
            }
        }

        const [apartmentsCount] = await ctx.db
            .select({ count: count() })
            .from(apartments)
            .where(eq(apartments.createdById, userId));

        const [favoritesCount] = await ctx.db
            .select({ count: count() })
            .from(favorites)
            .where(eq(favorites.userId, userId));

        // Заявки на бронирование квартир этого пользователя (как арендодателя)
        const [bookingsCount] = await ctx.db
            .select({ count: count() })
            .from(booking)
            .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
            .where(eq(apartments.createdById, userId));

        return {
            stats: {
                totalApartments: apartmentsCount?.count ?? 0,
                totalBookings: bookingsCount?.count ?? 0,
                totalFavorites: favoritesCount?.count ?? 0,
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
                telegramChatId: z
                    .string()
                    .trim()
                    .regex(/^-?\d{1,20}$/, 'Telegram chat id должен быть числом')
                    .nullable()
                    .optional(),
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
                    telegramChatId: input.telegramChatId ?? undefined,
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
            await requireTargetUser(ctx.db, ctx.session.user.role, ctx.session.user.id, input.userId);

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
            await requireTargetUser(ctx.db, ctx.session.user.role, ctx.session.user.id, input.userId);

            const [updated] = await ctx.db
                .update(users)
                .set({ bannedUntil: new Date(Date.now() + input.days * 86_400_000) })
                .where(eq(users.id, input.userId))
                .returning();
            return updated;
        }),

    // 7. Разбанить пользователя
    unbanUser: protectedProcedure.input(z.object({ userId: z.string() })).mutation(async ({ ctx, input }) => {
        await requireTargetUser(ctx.db, ctx.session.user.role, ctx.session.user.id, input.userId);

        const [updated] = await ctx.db
            .update(users)
            .set({ bannedUntil: null })
            .where(eq(users.id, input.userId))
            .returning();
        return updated;
    }),

    // 8. Telegram: начать привязку (генерируем одноразовый код)
    startTelegramLink: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const code = String(Math.floor(Math.random() * 900_000) + 100_000);

        await ctx.db.update(users).set({ telegramLinkCode: code }).where(eq(users.id, userId));

        return { code };
    }),

    // 9. Telegram: подтвердить привязку (webhook уже привязал chatId, осталось проверить)
    confirmTelegramLink: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const [user] = await ctx.db
            .select({ telegramChatId: users.telegramChatId })
            .from(users)
            .where(eq(users.id, userId));

        if (!user?.telegramChatId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message:
                    'Сообщение с кодом пока не получено. Убедитесь, что код отправлен боту @radius_booking_bot точно как на экране',
            });
        }

        return { chatId: user.telegramChatId };
    }),

    // 10. Telegram: отвязать
    clearTelegramLink: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        await ctx.db.update(users).set({ telegramChatId: null, telegramLinkCode: null }).where(eq(users.id, userId));
        return { ok: true };
    }),
});
