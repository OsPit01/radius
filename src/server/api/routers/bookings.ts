import { string, z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { booking, apartments, users, notification } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { isValidPhoneNumber } from "@/lib/phone";

const createBookingSchema = z.object({
  apartmentId: z.number().int().positive(),
  guestName: z.string().trim().min(1, "Укажите имя").max(255),
  guestPhone: z
    .string()
    .trim()
    .min(1, "Укажите телефон")
    .max(50)
    .refine(isValidPhoneNumber, "Неверный номер телефона"),
  guests: z.number().int().positive().max(20),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  message: z.string().trim().max(1000).optional(),
});

export const bookingsRouter = createTRPCRouter({
  create: publicProcedure
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;

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
    return ctx.db
      .select({
        booking: booking,
        apartment: {
          title: apartments.title,
          city: apartments.city,
          street: apartments.street,
          numberHome: apartments.numberHome,
        },
      })
      .from(booking)
      .innerJoin(apartments, eq(booking.apartmentId, apartments.id))
      .where(eq(apartments.createdById, userId));
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
      // ШАГ 3: проверить, что владелец квартиры === текущий юзер
      if (apartment.createdById !== userId)
        throw new TRPCError({ code: "FORBIDDEN" });
      // обновить status у брони и вернуть
      const [updated] = await ctx.db
        .update(booking)
        .set({ status: input.status })
        .where(eq(booking.id, input.bookingId))
        .returning();
      return updated;
    }),
});
