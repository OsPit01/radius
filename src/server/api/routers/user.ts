import { TRPCError } from '@trpc/server';
import { and, count, eq, ilike, or } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { z } from 'zod';

import { getRoleInfo, hasPermission, isAdminRole, ROLE_VALUES_TUPLE } from '@/lib/constants/roles';
import { removeApartmentImages } from '@/server/apartment-images';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import type * as schema from '@/server/db/schemas';
import { apartments, booking, favorites, users } from '@/server/db/schemas';
import { enforceRateLimit } from '@/server/rate-limit';

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
    // 1. Получить пользователей (админка). Поиск — на сервере: в браузер уходят
    // только совпадения, а не весь список (табу: ничего лишнего в клиент).
    getAll: protectedProcedure
        .input(
            z.object({
                query: z.string().trim().max(200).optional(),
            }),
        )
        .query(async ({ ctx, input }) => {
            // Проверка: только админы могут видеть пользователей
            const userRole = ctx.session.user?.role;

            if (!isAdminRole(userRole)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'У вас нет прав на просмотр всех пользователей',
                });
            }

            // % и _ — шаблонные символы ILIKE: экранируем, чтобы поиск «100%» не ловил всё подряд.
            const escaped = input?.query?.replace(/[\\%_]/g, (ch) => `\\${ch}`);

            // Пустой запрос — без условия (вернём всех). Иначе: email содержит строку,
            // ИЛИ id начинается с неё.
            const searchCondition = escaped
                ? or(ilike(users.email, `%${escaped}%`), ilike(users.id, `${escaped}%`))
                : undefined;

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
                    lastSeenAt: users.lastSeenAt,
                })
                .from(users)
                .where(searchCondition);
        }),
    // 2. Получить одного пользователя по ID
    getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        const isSelf = input.id === ctx.session.user.id;

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

        // Безопасность: личные данные доступны только САМОМУ пользователю
        // или администратору. Иерархия ролей: админ не читает данные
        // пользователя с равным или более высоким уровнем («читать наверх»).
        if (!isSelf) {
            if (!isAdminRole(ctx.session.user.role)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Нет доступа к данным другого пользователя',
                });
            }
            if (getRoleInfo(user.role).level >= getRoleInfo(ctx.session.user.role).level) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Нельзя читать данные пользователя с равным или более высоким уровнем',
                });
            }
        }

        return user;
    }),
    // 3. Обновить роль пользователя (только для админа)

    updateRole: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                // zod требует КОРТЕЖ ([A, ...A[]]), а не массив —
                // ROLE_VALUES_TUPLE выведен из ROLES (см. roles.ts), не дублирован.
                role: z.enum(ROLE_VALUES_TUPLE),
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
                // Только id: полная строка юзера содержит секретные поля
                // (telegramLinkCode, telegramChatId) — их наружу не отдаём.
                .returning({ id: users.id });
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

        // Заявки на квартиры этого пользователя (он — арендодатель) —
        // только ЖДУЩИЕ решения (status='new'): важно, сколько ждёт ответа владельца.
        const [bookingsCount] = await ctx.db
            .select({ count: count() })
            .from(booking)
            .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
            .where(and(eq(apartments.createdById, userId), eq(booking.status, 'new')));

        // Брони этого пользователя как ГОСТЯ (он снимает жильё) —
        // только ожидающие подтверждения (status='new').
        const [myBookingsCount] = await ctx.db
            .select({ count: count() })
            .from(booking)
            .where(and(eq(booking.userId, userId), eq(booking.status, 'new')));

        return {
            stats: {
                totalApartments: apartmentsCount?.count ?? 0,
                totalBookings: bookingsCount?.count ?? 0,
                totalMyBookings: myBookingsCount?.count ?? 0,
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
                // Только id — секретные поля (telegram*) наружу не уходят.
                .returning({ id: users.id });
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
                // Только id — секретные поля (telegram*) наружу не уходят.
                .returning({ id: users.id });
            return updated;
        }),

    // 7. Разбанить пользователя
    unbanUser: protectedProcedure.input(z.object({ userId: z.string() })).mutation(async ({ ctx, input }) => {
        await requireTargetUser(ctx.db, ctx.session.user.role, ctx.session.user.id, input.userId);

        const [updated] = await ctx.db
            .update(users)
            .set({ bannedUntil: null })
            .where(eq(users.id, input.userId))
            // Только id — секретные поля (telegram*) наружу не уходят.
            .returning({ id: users.id });
        return updated;
    }),

    // 9. Удалить пользователя: каскадно удаляет все его данные.
    // Только супер админ / главный админ — удаление безвозвратно.
    deleteUser: protectedProcedure.input(z.object({ userId: z.string() })).mutation(async ({ ctx, input }) => {
        if (!hasPermission(ctx.session.user.role, 'superadmin')) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только супер админ или главный админ может удалять пользователей',
            });
        }
        // Общие проверки: не самого себя, цель существует и ниже уровнем.
        await requireTargetUser(ctx.db, ctx.session.user.role, ctx.session.user.id, input.userId);

        // 1. СОБИРАЕМ фото квартир юзера ДО удаления: после cascade их уже не достать.
        const owned = await ctx.db
            .select({ images: apartments.images })
            .from(apartments)
            .where(eq(apartments.createdById, input.userId));
        const imageUrls = owned.flatMap((a) => a.images ?? []);

        // 2. Удаляем юзера — каскады (onDelete: cascade) сносят квартиры,
        //    брони, избранное, сообщения, уведомления и т.д.
        await ctx.db.delete(users).where(eq(users.id, input.userId));

        // 3. Фото жили в Storage, а не в БД — стираем файлы отдельно.
        await removeApartmentImages(imageUrls);

        return { success: true };
    }),

    // 10. Данные юзера для модалки «удалить пользователя».
    // Мутация (а не query): вызывается по клику «Удалить» и отдаёт данные для карточки.
    getDeleteInfo: protectedProcedure.input(z.object({ userId: z.string() })).mutation(async ({ ctx, input }) => {
        if (!hasPermission(ctx.session.user.role, 'superadmin')) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только супер админ или главный админ может удалять пользователей',
            });
        }
        if (input.userId === ctx.session.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Нельзя удалить самого себя' });
        }
        const [target] = await ctx.db.select().from(users).where(eq(users.id, input.userId));
        if (!target) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Пользователь не найден' });
        }
        if (getRoleInfo(target.role).level >= getRoleInfo(ctx.session.user.role).level) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Нельзя удалить пользователя с равным или более высоким уровнем',
            });
        }
        return {
            id: target.id,
            email: target.email,
            name: target.name,
            firstName: target.firstName,
            lastName: target.lastName,
            role: target.role,
            createdAt: target.createdAt,
            totalApartments: target.totalApartments,
            totalBookings: target.totalBookings,
            totalFavorites: target.totalFavorites,
        };
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

    // ============================================================
    // ПРИСУТСТВИЕ (онлайн/офлайн)
    //
    // heartbeat обновляет lastSeenAt у СЕБЯ. Клиентский хук
    // useOnlineHeartbeat зовёт его раз в минуту, пока вкладка открыта.
    // Лимит 60 в минуту — запас против флуда: хук шлёт 1 раз в 60 секунд,
    // а лимит даёт 60 — хватает и на переоткрытия вкладок.
    // ============================================================
    heartbeat: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        await enforceRateLimit(ctx.db, `heartbeat:${userId}`, 60, 60_000);
        await ctx.db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, userId));
        return { ok: true };
    }),
});
