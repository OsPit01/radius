import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { apartments, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ===== ВАЛИДАЦИЯ ДЛЯ СОЗДАНИЯ КВАРТИРЫ =====
const createApartmentSchema = z.object({
  type: z.string(),
  title: z.string().min(3, "Название минимум 3 символа"),
  city: z.string().min(2, "Город обязателен"),
  street: z.string().min(2, "Улица обязательна"),
  numberHome: z.string().min(1, "Номер дома обязатеелен"),
  building: z.string().nullable().optional(),

  // ЧТО И ЗАЧЕМ ТУТ МЕНЯТЬ: Убрали .min(2) и сделали поле .optional().default("").
  // Теперь пустой инпут района на фронтенде не будет вызывать ошибку Zod "too_small" на сервере!
  district: z.string().optional().default(""),

  formattedAddress: z.string().optional().default(""),
  capacity: z.number().min(1).max(20),
  price: z.number().positive("Цена должна быть положительной"),
  image: z.string().url("Некорректный URL"),
  description: z.string().optional(),
  rooms: z.number().min(1).max(10),
  metro: z.string().optional(),
  //////////////////////////////
  currency: z.string().default("BYN"),
  amenities: z.array(z.string()).optional().default([]),
  parking: z.string().optional().default(""),
  images: z.array(z.string()).optional().default([]),
});

export const apartmentRouter = createTRPCRouter({
  // 1. Получить все квартиры
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        apartment: apartments,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(apartments)
      .leftJoin(users, eq(apartments.createdById, users.id));
  }),

  // 2. Получить одну квартиру по ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [apartment] = await ctx.db
        .select({
          apartment: apartments,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
          },
        })
        .from(apartments)
        .leftJoin(users, eq(apartments.createdById, users.id))
        .where(eq(apartments.id, input.id));

      if (!apartment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Квартира не найдена",
        });
      }
      return apartment;
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
          rooms: input.rooms,
          metro: input.metro ?? null,
          createdById: userId,
          currency: input.currency ?? "BYN",
          amenities: input.amenities ?? [],
          parking: input.parking ?? "",
          images: input.images ?? [],
          statusObject: true,
        })
        .returning();

      return newApartment;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(apartments).where(eq(apartments.id, input.id));
      return { success: true };
    }),

  // 4. Получить объекты текущего пользователя
  getMyApartments: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    return await ctx.db
      .select({
        apartment: apartments,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(apartments)
      .leftJoin(users, eq(apartments.createdById, users.id))
      .where(eq(apartments.createdById, userId));
  }),
});
