import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { formatAddressLine } from '@/lib/address';
import { getCanonicalMicrodistrict } from '@/lib/constants';
import { APARTMENT_STATUS_VALUES } from '@/lib/constants/apartment-status';
import { getRegion, getRegionByLocality } from '@/lib/constants/belarus-locations';
import { isAdminRole, isStaffRole } from '@/lib/constants/roles';
import { createApartmentInput, updateApartmentInput } from '@/lib/validation/apartment';
import { idSchema } from '@/lib/validation/common';
import { isAddressChanged } from '@/server/apartment-address';
import { buildCatalogConditions, catalogFiltersSchema } from '@/server/apartment-filters';
import { removeApartmentImages } from '@/server/apartment-images';
import { notifyOwnerAboutStatusChange } from '@/server/apartment-moderation';
import {
    apartmentPrivateColumns,
    hideTestApartments,
    listingRank,
    selectApartmentCards,
    selectApartmentOwnList,
    selectApartmentPublic,
    selectApartmentWithUser,
} from '@/server/apartment-selects';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { apartments, users } from '@/server/db/schemas';

// ===== ОБЩИЕ СХЕМЫ ВВОДА =====
const apartmentIdInput = z.object({
    id: z.number().int().positive('Некорректный идентификатор объекта'),
});

// Схемы ввода объекта строятся из таблицы apartments — см. src/lib/validation/apartment.ts
export const apartmentRouter = createTRPCRouter({
    // 1. Получить все квартиры (с фильтрами для SEO-страниц каталога)
    getAll: publicProcedure.input(catalogFiltersSchema.optional()).query(async ({ ctx, input }) => {
        const conditions = buildCatalogConditions(input, ctx.session?.user.role);

        // Публично отдаём только карточку: без данных владельца и служебных полей.
        // Порядок: сначала объекты с местом в выдаче (rank 0, 1, 2…), остальные — в случайном порядке,
        // чтобы все владельцы получали равное внимание. Случайность заново при каждой загрузке страницы.
        // Пагинация: защищает от раздувания ответа при росте каталога.
        return await selectApartmentCards(ctx.db)
            .where(and(...conditions))
            .orderBy(listingRank, sql`random()`)
            .limit(input?.limit ?? 50)
            .offset(input?.offset ?? 0);
    }),
    getCatalogLocations: publicProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select({
                city: apartments.city,
                region: apartments.region,
                microdistrict: apartments.microdistrict,
            })
            .from(apartments)
            .where(and(eq(apartments.status, 'active'), hideTestApartments(ctx.session?.user.role)));

        // Город попадает ВСЕГДА, даже без микрорайонов — иначе он исчезнет из каталога.
        // region: колонка бывает пустой у легаси-объектов — восстанавливаем по
        // справочнику (область, в которой числится такой населённый пункт).
        // count: сколько активных квартир в городе — для плиток каталога.
        const byCity = new Map<
            string,
            { microdistricts: string[]; region: ReturnType<typeof getRegion> | null; count: number }
        >();
        for (const row of rows) {
            const entry = byCity.get(row.city) ?? {
                microdistricts: [],
                region: getRegion(row.region ?? '') ?? null,
                count: 0,
            };
            // У легаси-объектов region бывает пуст — восстанавливаем по справочнику
            // (область, в которой числится такой населённый пункт).
            entry.region ??= getRegionByLocality(row.city);
            // Микрорайон отдаём ТОЛЬКО если он есть в справочнике для этого города,
            // и всегда в каноничном написании из справочника:
            // берём не как лежит в БД (с мусором/регистром), а из справочника.
            const canonical = row.microdistrict ? getCanonicalMicrodistrict(row.city, row.microdistrict) : null;
            if (canonical) {
                entry.microdistricts.push(canonical);
            }
            entry.count += 1;
            byCity.set(row.city, entry);
        }
        return Array.from(byCity, ([city, entry]) => ({
            city,
            microdistricts: Array.from(new Set(entry.microdistricts)),
            count: entry.count,
            region: entry.region
                ? { value: entry.region.value, label: entry.region.label, center: entry.region.center.name }
                : null,
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
        // или ПЕРСОНАЛУ (модератору и выше: нужно для проверки объекта
        // при модерации). Чужому авторизованному — FORBIDDEN.
        // isStaff (не isAdmin!): имя переменной обязано говорить, ЧТО в ней.
        const isOwner = apartment.apartment.createdById === ctx.session.user.id;
        const isStaff = isStaffRole(ctx.session.user.role);
        if (!isOwner && !isStaff) {
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
            and(
                eq(apartments.id, input.id),
                eq(apartments.status, 'active'),
                hideTestApartments(ctx.session?.user.role),
            ),
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
            .returning(apartmentPrivateColumns);

        // Денормализованный счётчик: +1 объект у владельца (атомарно, без гонки).
        await ctx.db
            .update(users)
            .set({ totalApartments: sql`${users.totalApartments} + 1` })
            .where(eq(users.id, userId));

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
        // Адрес — только администратор: он влияет на публичную страницу, карту, поиск и SEO.
        if (!isAdmin && isAddressChanged(existing, input)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Адрес объекта может изменить только администратор',
            });
        }
        const nextCity = input.city ?? existing.city;
        const nextStreet = input.street ?? existing.street;
        const nextNumberHome = input.numberHome ?? existing.numberHome;
        const nextBuilding = input.building ?? existing.building;
        // Поле, которого нет в запросе, не трогаем (undefined drizzle пропускает), а не сбрасываем в 0/null.
        const { id, ...fields } = input;
        const [updated] = await ctx.db
            .update(apartments)
            .set({
                ...fields,
                formattedAddress: formatAddressLine({
                    city: nextCity,
                    street: nextStreet,
                    numberHome: nextNumberHome,
                    building: nextBuilding,
                }),
                updatedAt: new Date(),
            })
            .where(eq(apartments.id, id))
            .returning(apartmentPrivateColumns);

        // Файлы, которые убрали из списка, удаляем и из хранилища — иначе они
        // останутся «висеть» в Supabase Storage и занимать место.
        await removeApartmentImages((existing.images ?? []).filter((url) => !(input.images ?? []).includes(url)));

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

        // Фото живут в Supabase Storage, а не в БД: каскады БД про них не знают —
        // строку удалили, теперь стираем и файлы. ПОСЛЕ удаления строки, а не до:
        // если remove упадёт, максимум останется мусор в хранилище (объект уже
        // удалён) — а не живой объект с битыми фото.
        await removeApartmentImages(existing.images ?? []);

        // Денормализованный счётчик: -1 объект у владельца.
        if (existing.createdById) {
            await ctx.db
                .update(users)
                .set({ totalApartments: sql`${users.totalApartments} - 1` })
                .where(eq(users.id, existing.createdById));
        }

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
        return await selectApartmentOwnList(ctx.db).where(
            and(eq(apartments.createdById, input.userId), hideTestApartments(ctx.session.user.role)),
        );
    }),
    //вернуть все объекты
    getForModeration: protectedProcedure.query(async ({ ctx }) => {
        // Модерация контента — работа ПЕРСОНАЛА (модератор и выше).
        if (!isStaffRole(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'У вас нет прав на модерацию',
            });
        }
        return await selectApartmentWithUser(ctx.db).where(hideTestApartments(ctx.session.user.role));
    }),

    //Админ панель* Обновить статус
    updateStatus: protectedProcedure
        .input(
            z.object({
                id: idSchema,
                status: z.enum(APARTMENT_STATUS_VALUES),
                rejectionReason: z.string().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // Одобрить/отклонить — работа ПЕРСОНАЛА (модератор и выше),
            // как и getForModeration: модератор видит очередь И умеет решать.
            if (!isStaffRole(ctx.session.user.role)) {
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
                .returning(apartmentPrivateColumns);
            if (!update) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Объект не найден!',
                });
            }
            // Уведомить владельца и, при одобрении, сделать его арендодателем.
            await notifyOwnerAboutStatusChange(ctx.db, update, input.status, input.rejectionReason);
            return update;
        }),
    // Назначить микрорайон объекту. Модерация: модератор и выше ставят/меняют район
    // независимо от статуса. Пустая строка или null = сброс (объект «просто город»).
    setMicrodistrict: protectedProcedure
        .input(
            z.object({
                id: z.number().int().positive('Некорректный идентификатор объекта'),
                microdistrict: z.string().trim().max(200).nullable(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // Назначение района — работа персонала (модератор и выше).
            if (!isStaffRole(ctx.session.user.role)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'У вас нет прав на назначение микрорайона' });
            }
            const [existing] = await ctx.db
                .select({ id: apartments.id, city: apartments.city })
                .from(apartments)
                .where(eq(apartments.id, input.id));
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Объект не найден' });
            }
            // Пустое значение (null или '') → сброс района.
            const canonical = input.microdistrict
                ? getCanonicalMicrodistrict(existing.city, input.microdistrict)
                : null;
            if (input.microdistrict && !canonical) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Микрорайон «${input.microdistrict}» не задан для города «${existing.city}»`,
                });
            }
            // Сохраняем каноничное написание из справочника (или null при сбросе).
            const [updated] = await ctx.db
                .update(apartments)
                .set({ microdistrict: canonical })
                .where(eq(apartments.id, input.id))
                .returning(apartmentPrivateColumns);
            return updated;
        }),
});
