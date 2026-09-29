import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { booking, apartments, users, notification } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { isValidPhoneNumber } from "@/lib/phone";
import { expireStaleBookings } from "@/server/booking-expiry";
import { enforceRateLimit } from "@/server/rate-limit";
import {
  MAX_BOOKING_GUESTS,
  MIN_BOOKING_GUESTS,
} from "@/lib/constants/booking";

// Защита от флуда: сколько заявок один гость может оставить за одно окно.
const BOOKING_RATE_LIMIT = 5;
const BOOKING_RATE_WINDOW_MS = 10 * 60 * 1000;

const createBookingSchema = z.object({
  apartmentId: z.number().int().positive(),
  guestName: z.string().trim().min(1, "Укажите имя").max(255),
  guestPhone: z
    .string()
    .trim()
    .min(1, "Укажите телефон")
    .max(50)
    .refine(isValidPhoneNumber, "Неверный номер телефона"),
  guests: z
    .number({ message: "Укажите количество гостей" })
    .int()
    .min(MIN_BOOKING_GUESTS, "Укажите количество гостей")
    .max(MAX_BOOKING_GUESTS, `Максимум ${MAX_BOOKING_GUESTS} гостей`),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  message: z.string().trim().max(1000).optional(),
});

export const bookingsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await enforceRateLimit(
        ctx.db,
        `booking:${userId}`,
        BOOKING_RATE_LIMIT,
        BOOKING_RATE_WINDOW_MS,
      );

      const [apartment] = await ctx.db
        .select()
        .from(apartments)
        .where(eq(apartments.id, input.apartmentId));

      if (!apartment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Квартира не найдена",
        });
      }

      if (apartment.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Квартира недоступна для бронирования",
        });
      }

      if (input.checkOutDate <= input.checkInDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Дата выезда должна быть позже даты заезда",
        });
      }

      if (apartment.capacity > 0 && input.guests > apartment.capacity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Квартира рассчитана максимум на ${apartment.capacity} гостей`,
        });
      }

      // Владельца ищем ДО вставки брони: если его вдруг нет (битые данные
      // объекта), заявка не должна попасть в БД «наполовину» — иначе получим
      // запись, о которой никто не узнает (ни уведомления, ни Telegram).
      const [owner] = await ctx.db
        .select({
          telegramChatId: users.telegramChatId,
          name: users.name,
          id: users.id,
        })
        .from(users)
        .where(eq(users.id, apartment.createdById ?? ""));
      if (!owner?.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [created] = await ctx.db
        .insert(booking)
        .values({
          apartmentId: input.apartmentId,
          userId,
          guestName: input.guestName,
          guestPhone: input.guestPhone,
          guests: input.guests,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          message: input.message ?? null,
        })
        .returning();

      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      const [createNotification] = await ctx.db
        .insert(notification)
        .values({
          userId: owner?.id,
          type: "booking_new",
          title: "Новая заявка на бронирование",
          text: `Заявка на бронирование «${apartment.title}». Заезд: ${input.checkInDate.toLocaleDateString("ru-RU")} выезд: ${input.checkOutDate.toLocaleDateString("ru-RU")} имя гостя: ${input.guestName} номер телефона гостя: ${input.guestPhone}`,
          apartmentId: input.apartmentId,
          link: "/profile/bookings",
        })
        .returning();
      if (!createNotification) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      const chatId = owner?.telegramChatId;

      if (chatId) {
        const text = [
          `<b>Новая заявка на бронирование</b>`,
          ``,
          `<b>Квартира:</b> ${apartment.title}`,
          `<b>Гость:</b> ${input.guestName}`,
          `<b>Телефон:</b> ${input.guestPhone}`,
          `<b>Гостей:</b> ${input.guests}`,
          `<b>Заезд:</b> ${input.checkInDate.toLocaleDateString("ru-RU")}`,
          `<b>Выезд:</b> ${input.checkOutDate.toLocaleDateString("ru-RU")}`,
        ];
        if (input.message) {
          text.push(``, `<b>Комментарий:</b> ${input.message}`);
        }

        await sendTelegramMessage(chatId, text.join("\n"));
      }

      return { id: created.id };
    }),

  listForOwner: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    // Заявки на квартиры владельца + данные гостя (booking) и владельца (owner).
    return ctx.db
      .select({
        booking: booking,
        apartment: {
          title: apartments.title,
          city: apartments.city,
          street: apartments.street,
          numberHome: apartments.numberHome,
        },
        owner: {
          id: apartments.createdById,
          name: users.name,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(booking)
      .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
      .innerJoin(users, eq(apartments.createdById, users.id))
      .where(eq(apartments.createdById, userId));
  }),
  listForUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    // Брони гостя + данные владельца квартиры (чтобы гость мог связаться).
    return ctx.db
      .select({
        booking: booking,
        apartment: {
          title: apartments.title,
          city: apartments.city,
          street: apartments.street,
          numberHome: apartments.numberHome,
        },
        owner: {
          id: apartments.createdById,
          name: users.name,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(booking)
      .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
      .innerJoin(users, eq(apartments.createdById, users.id))
      .where(eq(booking.userId, userId));
  }),
  cancel: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [targetBooking] = await ctx.db
        .select()
        .from(booking)
        .where(eq(booking.id, input.bookingId));
      if (!targetBooking) throw new TRPCError({ code: "NOT_FOUND" });

      const [apartment] = await ctx.db
        .select()
        .from(apartments)
        .where(eq(apartments.id, targetBooking.apartmentId));
      if (!apartment) throw new TRPCError({ code: "NOT_FOUND" });

      if (targetBooking.userId !== userId)
        throw new TRPCError({ code: "FORBIDDEN" });

      const [updated] = await ctx.db
        .update(booking)
        .set({ status: "cancelled" })
        .where(eq(booking.id, input.bookingId))
        .returning();

      if (apartment?.createdById) {
        await ctx.db.insert(notification).values({
          userId: apartment.createdById,
          type: "booking_cancelled",
          title: "Бронь отменена гостем",
          text: "Гость отменил бронирование",

          apartmentId: targetBooking.apartmentId,
          link: "/profile/bookings",
        });
      }
      return updated;
    }),

  // Ленивая автоотмена просроченных заявок: вызывается со страницы «Мои брони»
  // при загрузке, чтобы таймер работал без внешнего cron (Vercel cron платный).
  expireBookings: protectedProcedure.mutation(async () => {
    const expired = await expireStaleBookings();
    return { expired };
  }),

  setStatus: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        status: z.enum(["approved", "rejected"] as const),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // найти ОДНУ бронь по input.bookingId
      const [targetBooking] = await ctx.db
        .select()
        .from(booking)
        .where(eq(booking.id, input.bookingId));

      if (!targetBooking) throw new TRPCError({ code: "NOT_FOUND" });

      const [apartment] = await ctx.db
        .select()
        .from(apartments)
        .where(eq(apartments.id, targetBooking.apartmentId));
      if (!apartment) throw new TRPCError({ code: "NOT_FOUND" });

      // проверить, что владелец квартиры === текущий юзер
      if (apartment.createdById !== userId)
        throw new TRPCError({ code: "FORBIDDEN" });

      // обновить status у брони и вернуть
      const [updated] = await ctx.db
        .update(booking)
        .set({ status: input.status })
        .where(eq(booking.id, input.bookingId))
        .returning();
      //уведомляем гостя если он авторизован
      if (targetBooking.userId) {
        await ctx.db
          .insert(notification)
          .values({
            userId: targetBooking.userId,
            type:
              input.status === "approved"
                ? "booking_approved"
                : "booking_rejected",
            title:
              input.status === "approved"
                ? "Заявка одобрена"
                : "Заявка отклонена",
            text: `Ваша заявка на «${apartment.title}» ${input.status === "approved" ? "одобрена" : "отклонена"}`,

            apartmentId: targetBooking.apartmentId,
            link: "/profile/bookings",
          })
          .returning();
      }
      return updated;
    }),
});
