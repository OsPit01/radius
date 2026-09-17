import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { apartments, users, notification } from "@/server/db/schema";
import { eq, and, gte, lte, ilike, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/server/db/schema";
import {
  APARTMENT_STATUS_VALUES,
  buildStatusNotificationText,
} from "@/lib/constants/apartment-status";
import { isAdminRole } from "@/lib/constants/roles";

type Database = PostgresJsDatabase<typeof schema>;

// ===== ОБЩИЙ ЗАПРОС: квартира + владелец =====
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

// ===== ЛЁГКИЙ ЗАПРОС для списка (без тяжёлого массива images и лишних полей) =====
const selectApartmentLight = (db: Database) =>
  db
    .select({
      apartment: {
        id: apartments.id,
        type: apartments.type,
        title: apartments.title,
        city: apartments.city,
        district: apartments.district,
        capacity: apartments.capacity,
        price: apartments.price,
        image: apartments.image,
        description: apartments.description,
        rooms: apartments.rooms,
        beds: apartments.beds,
        singleBeds: apartments.singleBeds,
        doubleSofas: apartments.doubleSofas,
        singleSofas: apartments.singleSofas,
        metro: apartments.metro,
        currency: apartments.currency,
        status: apartments.status,
        rejectionReason: apartments.rejectionReason,
        createdAt: apartments.createdAt,
        updatedAt: apartments.updatedAt,
      },
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

// ===== ВАЛИДАЦИЯ ДЛЯ СОЗДАНИЯ КВАРТИРЫ =====
const createApartmentSchema = z.object({
  type: z.string(),
  title: z.string().min(3, "Название минимум 3 символа"),
  city: z.string().min(2, "Город обязателен"),
  street: z
    .string()
    .min(2, "Улица обязательна")
    .regex(
      /^[A-Za-zА-Яа-яЁё\s.\-()]+$/,
      "В названии улицы не должно быть цифр",
    ),
  numberHome: z.string().min(1, "Номер дома обязатеелен"),
  building: z.string().nullable().optional(),

  // ЧТО И ЗАЧЕМ ТУТ МЕНЯТЬ: Убрали .min(2) и сделали поле .optional().default("").
  // Теперь пустой инпут района на фронтенде не будет вызывать ошибку Zod "too_small" на сервере!
  district: z.string().optional().default(""),

  formattedAddress: z.string().optional().default(""),
  capacity: z.number().min(1).max(20),
  price: z.number().positive("Цена должна быть положительной"),
  image: z.string(),
  description: z.string().optional(),
  rules: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  reviewsCount: z.number().optional(),
  rating: z.number().optional(),
  rooms: z.number().min(1).max(10),
  beds: z.number().min(0).max(20).optional(),
  singleBeds: z.number().min(0).max(20).optional(),
  doubleSofas: z.number().min(0).max(20).optional(),
  singleSofas: z.number().min(0).max(20).optional(),
  metro: z.string().optional(),
  //////////////////////////////
  currency: z.string().default("BYN"),
  amenities: z.array(z.string()).optional().default([]),
  payerType: z.string().default("individual"),
  payerName: z.string().optional().default(""),
  unp: z.string().optional().default(""),
  parking: z.string().optional().default(""),
  images: z.array(z.string()).optional().default([]),
});

export const apartmentRouter = createTRPCRouter({
  // 1. Получить все квартиры (с фильтрами для SEO-страниц каталога)
  getAll: publicProcedure
    .input(
      z
        .object({
          city: z.string().trim().min(1).optional(),
          guests: z.number().int().min(1).optional(),
          priceMin: z.number().int().min(0).optional(),
          priceMax: z.number().int().min(0).optional(),
          rooms: z.number().int().min(1).optional(),
          beds: z.number().int().min(1).optional(),
          sofas: z.number().int().min(1).optional(),
          metro: z.number().int().min(1).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(apartments.status, "active")];

      if (input?.city) {
        conditions.push(ilike(apartments.city, `%${input.city}%`));
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
        conditions.push(
          gte(
            sql`${apartments.beds} + ${apartments.singleBeds}`,
            input.beds,
          ),
        );
      }
      if (input?.sofas) {
        conditions.push(
          gte(
            sql`${apartments.doubleSofas} + ${apartments.singleSofas}`,
            input.sofas,
          ),
        );
      }
      if (input?.metro) {
        // metro хранится как varchar (минуты пешком), поэтому сравниваем численно через CAST
        conditions.push(
          sql`${apartments.metro} IS NOT NULL AND ${apartments.metro} <> '' AND CAST(${apartments.metro} AS INTEGER) <= ${input.metro}`,
        );
      }

      return await selectApartmentLight(ctx.db).where(and(...conditions));
    }),

  // 2. Получить одну квартиру по ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [apartment] = await selectApartmentWithUser(ctx.db).where(
        eq(apartments.id, input.id),
      );

      if (!apartment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Квартира не найдена",
        });
      }
      return apartment;
    }),
  // 2.1. Получить одну квартиру по ID (публичный доступ)
  getByIdPublic: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      // Публично доступны только опубликованные (active) квартиры.
      const [apartment] = await selectApartmentWithUser(ctx.db).where(
        and(eq(apartments.id, input.id), eq(apartments.status, "active")),
      );

      return apartment ?? null;
    }),

  // 3. Создать квартиру
  create: protectedProcedure
    .input(createApartmentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Пользователь не авторизован",
        });
      }

      const [newApartment] = await ctx.db
        .insert(apartments)
        .values({
          title: input.title,
          type: input.type,
          city: input.city,
          street: input.street,
          numberHome: input.numberHome,
          district: input.district,
          building: input.building ?? null,
          formattedAddress: input.formattedAddress,
          capacity: input.capacity,
          price: input.price,
          image: input.image,
          description: input.description ?? null,
          rules: input.rules ?? null,
          checkInTime: input.checkInTime ?? null,
          checkOutTime: input.checkOutTime ?? null,
          reviewsCount: input.reviewsCount ?? 0,
          rating: input.rating ?? 0,
          rooms: input.rooms,
          beds: input.beds ?? 0,
          singleBeds: input.singleBeds ?? 0,
          doubleSofas: input.doubleSofas ?? 0,
          singleSofas: input.singleSofas ?? 0,
          metro: input.metro ?? null,
          createdById: userId,
          currency: input.currency ?? "BYN",
          amenities: input.amenities ?? [],
          payerType: input.payerType ?? "individual",
          payerName: input.payerName ?? "",
          unp: input.unp ?? "",
          parking: input.parking ?? "",
          images: input.images ?? [],
          status: "moderation",
        })
        .returning();

      return newApartment;
    }),

  // 3.5. Обновить квартиру
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(3),
        city: z.string().min(2),
        street: z
          .string()
          .min(2)
          .regex(
            /^[A-Za-zА-Яа-яЁё\s.\-()]+$/,
            "В названии улицы не должно быть цифр",
          ),
        numberHome: z.string().min(1),
        building: z.string().nullable().optional(),
        district: z.string().optional(),
        formattedAddress: z.string().optional(),
        capacity: z.number().min(1).max(20),
        price: z.number().positive(),
        currency: z.string().default("BYN"),
        image: z.string(),
        description: z.string().optional(),
        rules: z.string().optional(),
        checkInTime: z.string().optional(),
        checkOutTime: z.string().optional(),
        rooms: z.number().min(1).max(10),
        beds: z.number().min(0).max(20).optional(),
        singleBeds: z.number().min(0).max(20).optional(),
        doubleSofas: z.number().min(0).max(20).optional(),
        singleSofas: z.number().min(0).max(20).optional(),
        metro: z.string().optional(),
        amenities: z.array(z.string()).optional().default([]),
        payerType: z.string().default("individual"),
        payerName: z.string().optional().default(""),
        unp: z.string().optional().default(""),
        parking: z.string().optional().default(""),
        images: z.array(z.string()).optional().default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Пользователь не авторизован",
        });
      }

      // Проверяем, что объект принадлежит пользователю
      const [existing] = await ctx.db
        .select()
        .from(apartments)
        .where(eq(apartments.id, input.id));
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Объект не найден" });
      }
      const isOwner = existing.createdById === ctx.session.user.id;
      const isAdmin = isAdminRole(ctx.session.user.role);

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на редактирование этого объекта",
        });
      }

      // Адрес опубликованного объекта может менять только администратор.
      // Обычный владелец не может менять адрес, пока объект уже опубликован.
      if (existing.status === "active" && !isAdmin) {
        const addressChanged =
          existing.city !== input.city ||
          existing.street !== input.street ||
          existing.numberHome !== input.numberHome ||
          (existing.building ?? "") !== (input.building ?? "") ||
          (existing.district ?? "") !== (input.district ?? "") ||
          (existing.formattedAddress ?? "") !==
            (input.formattedAddress ?? "");

        if (addressChanged) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Изменение адреса опубликованного объекта доступно только администратору",
          });
        }
      }

      const [updated] = await ctx.db
        .update(apartments)
        .set({
          title: input.title,
          city: input.city,
          street: input.street,
          numberHome: input.numberHome,
          building: input.building,
          district: input.district,
          capacity: input.capacity,
          price: input.price,
          currency: input.currency,
          image: input.image,
          description: input.description,
          rules: input.rules,
          checkInTime: input.checkInTime ?? null,
          checkOutTime: input.checkOutTime ?? null,
          rooms: input.rooms,
          beds: input.beds ?? 0,
          singleBeds: input.singleBeds ?? 0,
          doubleSofas: input.doubleSofas ?? 0,
          singleSofas: input.singleSofas ?? 0,
          metro: input.metro,
          amenities: input.amenities,
          payerType: input.payerType,
          payerName: input.payerName,
          unp: input.unp ?? "",
          parking: input.parking,
          images: input.images,
          updatedAt: new Date(),
        })
        .where(eq(apartments.id, input.id))
        .returning();

      return updated;
    }),
  //удалить обьект админ/собственник
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(apartments)
        .where(eq(apartments.id, input.id));
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Объект не найден" });
      }
      //юзер либо владелец, либо админ
      const isOwner = existing.createdById === ctx.session.user.id;
      const isAdmin = isAdminRole(ctx.session.user.role);
      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на удаление этого объекта",
        });
      }
      await ctx.db.delete(apartments).where(eq(apartments.id, input.id));
      return { success: true };
    }),

  // 4. Получить объекты текущего пользователя
  getMyApartments: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    return await selectApartmentLight(ctx.db).where(
      eq(apartments.createdById, userId),
    );
  }),
  //вернуть все объекты
  getForModeration: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdminRole(ctx.session.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "У вас нет прав на модерацию",
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
          code: "FORBIDDEN",
          message: "У вас нет прав на модерацию",
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
          code: "NOT_FOUND",
          message: "Объект не найден!",
        });
      }
      if (update.createdById) {
        await ctx.db.insert(notification).values({
          userId: update.createdById, // кому - владелец
          type: `status_${input.status}`, // тип — что случилось
          title: "Статус объекта изменён",
          // заголовок для глаз
          text: buildStatusNotificationText(
            input.status,
            update.title,
            input.rejectionReason,
          ),
          apartmentId: input.id, // о каком объекте
          link: `/apartments/${input.id}`, // куда ведёт уведомление
        });
      }
      return update;
    }),
});
