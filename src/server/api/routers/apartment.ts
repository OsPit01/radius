import { TRPCError } from '@trpc/server';
import { and, eq, gt, gte, ilike, lte, or, type SQL, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { z } from 'zod';

import { formatAddressLine } from '@/lib/address';
import { APARTMENT_STATUS_VALUES, buildStatusNotificationText } from '@/lib/constants/apartment-status';
import { isAdminRole } from '@/lib/constants/roles';
import { createApartmentInput, updateApartmentInput } from '@/lib/schemas/apartment';
import { selectApartmentCards, selectApartmentOwnList, selectApartmentPublic } from '@/server/apartment-selects';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import type * as schema from '@/server/db/schema';
import { apartments, notification, users } from '@/server/db/schema';

type Database = PostgresJsDatabase<typeof schema>;

// ===== ОБЩИЕ СХЕМЫ ВВОДА =====
const apartmentIdInput = z.object({
    id: z.number().int().positive('Некорректный идентификатор объекта'),
});

// ===== ЗАПРОС ДЛЯ ПРИВАТНЫХ ПРОЦЕДУР (владелец / админ) =====
// Здесь отдаём квартиру целиком: нужны все поля, включая служебные.
// Публичные процедуры (главная, страница объекта) так делать НЕ должны —
// они используют selectApartmentCards / selectApartmentPublic из
// src/server/apartment-selects.ts, где список безопасных полей один на всех.
const selectApartmentWithUser = (db: Database) =>
    db
        .select({
            apartment: apartments,
            user: {
                id: users.id,
                name: users.name,
                email: users.email,
                image: users.image,
                phone: users.phone,
                firstName: users.firstName,
                lastName: users.lastName,
                patronymic: users.patronymic,
            },
        })
        .from(apartments)
        .leftJoin(users, eq(apartments.createdById, users.id));

// Схемы ввода объекта строятся из таблицы apartments — см. src/lib/schemas/apartment.ts
export const apartmentRouter = createTRPCRouter({
    // 1. Получить все квартиры (с фильтрами для SEO-страниц каталога)
    getAll: publicProcedure
        .input(
            z
                .object({
                    // Свободный поиск: город, улица или микрорайон содержит строку.
                    city: z.string().trim().min(1).optional(),
                    // Точное название города (apartments.city) — для страниц каталога /rent/flat/{город}/...
                    exactCity: z.string().trim().min(1).optional(),
                    // Точное название микрорайона, без учёта регистра: в БД оно набрано руками
                    // («Новая боровая»), а на сайте пишется «Новая Боровая».
                    microdistrict: z.string().trim().min(1).optional(),
                    guests: z.number().int().min(1).optional(),
                    priceMin: z.number().int().min(0).optional(),
                    priceMax: z.number().int().min(0).optional(),
                    rooms: z.number().int().min(1).optional(),
                    beds: z.number().int().min(1).optional(),
                    sofas: z.number().int().min(1).optional(),
                    metro: z.number().int().min(1).optional(),
                    limit: z.number().int().min(1).max(100).optional(),
                    offset: z.number().int().min(0).optional(),
                })
                .optional(),
        )
        .query(async ({ ctx, input }) => {
            const conditions: (SQL | undefined)[] = [eq(apartments.status, 'active')];

            if (input?.city) {
                conditions.push(
                    or(
                        ilike(apartments.city, `%${input.city}%`),
                        ilike(apartments.street, `%${input.city}%`),
                        ilike(apartments.microdistrict, `%${input.city}%`),
                    ),
                );
            }
            if (input?.exactCity) {
                conditions.push(eq(apartments.city, input.exactCity));
            }
            if (input?.microdistrict) {
                conditions.push(sql`lower(trim(${apartments.microdistrict})) = lower(${input.microdistrict})`);
            }
            if (input?.guests && input.guests > 1) {
                conditions.push(gte(apartments.capacity, input.guests));
            }
            if (input?.priceMin) {
                conditions.push(gte(apartments.price, input.priceMin));
            }
            if (input?.priceMax) {
                conditions.push(lte(apartments.price, input.priceMax));
            }
            if (input?.rooms) {
                // 4 = "4+", всё что от 4 и больше
                if (input.rooms >= 4) {
                    conditions.push(gte(apartments.rooms, input.rooms));
                } else {
                    conditions.push(eq(apartments.rooms, input.rooms));
                }
            }
            if (input?.beds) {
                conditions.push(gte(sql`${apartments.beds} + ${apartments.singleBeds}`, input.beds));
            }
            if (input?.sofas) {
                conditions.push(gte(sql`${apartments.doubleSofas} + ${apartments.singleSofas}`, input.sofas));
            }
            if (input?.metro) {
                conditions.push(and(gt(apartments.minsToMetro, 0), lte(apartments.minsToMetro, input.metro)));
            }

            // Публично отдаём только карточку: без данных владельца и служебных полей.
            // Пагинация: защищает от раздувания ответа при росте каталога.
            return await selectApartmentCards(ctx.db)
                .where(and(...conditions))
                .limit(input?.limit ?? 50)
                .offset(input?.offset ?? 0);
        }),
    getCatalogLocations: publicProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select({ city: apartments.city, microdistrict: apartments.microdistrict })
            .from(apartments)
            .where(eq(apartments.status, 'active'));

        // Группируем микрорайоны по городу
        const byCity = new Map<string, string[]>();
        for (const row of rows) {
            if (!row.microdistrict) {
                continue;
            } // пустые пропускаем
            const list = byCity.get(row.city) ?? [];
            list.push(row.microdistrict);
            byCity.set(row.city, list);
        }

        return Array.from(byCity, ([city, microdistricts]) => ({
            city,
            microdistricts: Array.from(new Set(microdistricts)),
        }));
    }),

    // 2. Получить одну квартиру по ID
    getById: protectedProcedure.input(apartmentIdInput).query(async ({ ctx, input }) => {
        const [apartment] = await selectApartmentWithUser(ctx.db).where(eq(apartments.id, input.id));

        if (!apartment) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Квартира не найдена',
            });
        }

        // Полные данные (включая email/телефон владельца) — только владельцу
        // или администратору. Чужому авторизованному — FORBIDDEN.
        const isOwner = apartment.apartment.createdById === ctx.session.user.id;
        const isAdmin = isAdminRole(ctx.session.user.role);
        if (!isOwner && !isAdmin) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'У вас нет прав на просмотр полных данных этого объекта',
            });
        }

        return apartment;
    }),
    // 2.1. Получить одну квартиру по ID (публичный доступ)
    getByIdPublic: publicProcedure.input(apartmentIdInput).query(async ({ ctx, input }) => {
        // Публично доступны только опубликованные (active) квартиры,
        // и только публичные поля (см. src/server/apartment-selects.ts).
        // Телефон владельца — персональные данные: анонимному посетителю
        // он не отдаётся вообще (затираем на null в ответе), а не прячется стилями.
        const canViewPhone = !!ctx.session?.user;

        const [apartment] = await selectApartmentPublic(ctx.db).where(
            and(eq(apartments.id, input.id), eq(apartments.status, 'active')),
        );

        if (!apartment) {
            return null;
        }

        return {
            ...apartment,
            user: apartment.user
                ? {
                      ...apartment.user,
                      phone: canViewPhone ? apartment.user.phone : null,
                  }
                : null,
            canViewPhone,
        };
    }),

    // 3. Создать квартиру
    create: protectedProcedure.input(createApartmentInput).mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        if (!userId) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Пользователь не авторизован',
            });
        }

        const [newApartment] = await ctx.db
            .insert(apartments)
            .values({
                ...input,
                // Форма адрес одной строкой не присылает: он нужен чатам и переписке, поэтому собираем его здесь.
                formattedAddress: formatAddressLine({
                    city: input.city,
                    street: input.street,
                    numberHome: input.numberHome,
                    building: input.building,
                }),
                reviewsCount: 0,
                createdById: userId,
                status: 'moderation',
            })
            .returning();

        return newApartment;
    }),

    // 3.5. Обновить квартиру
    update: protectedProcedure.input(updateApartmentInput).mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;

        if (!userId) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Пользователь не авторизован',
            });
        }

        // Проверяем, что объект принадлежит пользователю
        const [existing] = await ctx.db.select().from(apartments).where(eq(apartments.id, input.id));
        if (!existing) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Объект не найден' });
        }
        const isOwner = existing.createdById === ctx.session.user.id;
        const isAdmin = isAdminRole(ctx.session.user.role);

        if (!isOwner && !isAdmin) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'У вас нет прав на редактирование этого объекта',
            });
        }

        // Адрес опубликованного объекта может менять только администратор.
        // Обычный владелец не может менять адрес, пока объект уже опубликован.
        if (existing.status === 'active' && !isAdmin) {
            const addressChanged =
                existing.city !== input.city ||
                existing.street !== input.street ||
                existing.numberHome !== input.numberHome ||
                (existing.building ?? '') !== (input.building ?? '') ||
                (existing.district ?? '') !== (input.district ?? '') ||
                (existing.microdistrict ?? '') !== (input.microdistrict ?? '');

            if (addressChanged) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Изменение адреса опубликованного объекта доступно только администратору',
                });
            }
        }

        // Поле, которого нет в запросе, не трогаем (undefined drizzle пропускает), а не сбрасываем в 0/null.
        const { id, ...fields } = input;
        const [updated] = await ctx.db
            .update(apartments)
            .set({ ...fields, updatedAt: new Date() })
            .where(eq(apartments.id, id))
            .returning();

        return updated;
    }),
    //удалить обьект админ/собственник
    delete: protectedProcedure.input(apartmentIdInput).mutation(async ({ ctx, input }) => {
        const [existing] = await ctx.db.select().from(apartments).where(eq(apartments.id, input.id));
        if (!existing) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Объект не найден' });
        }
        //юзер либо владелец, либо админ
        const isOwner = existing.createdById === ctx.session.user.id;
        const isAdmin = isAdminRole(ctx.session.user.role);
        if (!isOwner && !isAdmin) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'У вас нет прав на удаление этого объекта',
            });
        }
        await ctx.db.delete(apartments).where(eq(apartments.id, input.id));
        return { success: true };
    }),

    // 4. Получить объекты текущего пользователя
    getMyApartments: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        return await selectApartmentOwnList(ctx.db).where(eq(apartments.createdById, userId));
    }),

    // Все объекты конкретного пользователя — только для администратора.
    getByUser: protectedProcedure.input(z.object({ userId: z.string() })).query(async ({ ctx, input }) => {
        if (!isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'У вас нет прав на просмотр чужих объектов',
            });
        }
        return await selectApartmentOwnList(ctx.db).where(eq(apartments.createdById, input.userId));
    }),
    //вернуть все объекты
    getForModeration: protectedProcedure.query(async ({ ctx }) => {
        if (!isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'У вас нет прав на модерацию',
            });
        }
        return await selectApartmentWithUser(ctx.db);
    }),

    //Админ панель* Обновить статус
    updateStatus: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                status: z.enum(APARTMENT_STATUS_VALUES),
                rejectionReason: z.string().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            if (!isAdminRole(ctx.session.user.role)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'У вас нет прав на модерацию',
                });
            }

            const [update] = await ctx.db
                .update(apartments)
                .set({
                    status: input.status,
                    rejectionReason: input.rejectionReason ?? null,
                })
                .where(eq(apartments.id, input.id))
                .returning();
            if (!update) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Объект не найден!',
                });
            }
            if (update.createdById) {
                await ctx.db.insert(notification).values({
                    userId: update.createdById, // кому - владелец
                    type: `status_${input.status}`, // тип — что случилось
                    title: 'Статус объекта изменён',
                    // заголовок для глаз
                    text: buildStatusNotificationText(input.status, update.title, input.rejectionReason),
                    apartmentId: input.id, // о каком объекте
                    link: `/apartments/${input.id}`, // куда ведёт уведомление
                });
            }
            if (input.status === 'active' && update.createdById) {
                // Меняем роль владельца объявления на "lessor"

                await ctx.db
                    .update(users)
                    .set({ role: 'lessor' })
                    .where(and(eq(users.id, update.createdById), eq(users.role, 'user')));
            }
            return update;
        }),
});
