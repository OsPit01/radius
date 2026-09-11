import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { booking, apartments, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendTelegramMessage } from "@/lib/telegram";

const createBookingSchema = z.object({
  apartmentId: z.number().int().positive(),
  guestName: z.string().trim().min(1, "Укажите имя").max(255),
  guestPhone: z.string().trim().min(1, "Укажите телефон").max(50),
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
        })
        .from(users)
        .where(eq(users.id, apartment.createdById ?? ""));

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
});