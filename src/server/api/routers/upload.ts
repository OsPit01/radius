import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getSupabaseAdmin } from "@/server/supabase";

// Максимальный размер загружаемого изображения — 5 МБ.
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const uploadRouter = createTRPCRouter({
  image: protectedProcedure
    .input(z.object({ dataUrl: z.string() }))
    .mutation(async ({ input }) => {
      // dataUrl выглядит так: "data:image/jpeg;base64,<данные>"
      const match = /^data:(image\/[\w+-]+);base64,(.+)$/.exec(input.dataUrl);
      if (!match) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Неверный формат изображения",
        });
      }

      const mimeType = match[1] ?? "image/jpeg";
      const base64 = match[2] ?? "";

      // SVG запрещён: может содержать скрипты (XSS).
      if (mimeType === "image/svg+xml") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Формат SVG не поддерживается",
        });
      }

      const buffer = Buffer.from(base64, "base64");

      // Лимит размера файла, чтобы не загружали слишком тяжёлые изображения.
      if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: "Файл слишком большой. Максимум 5 МБ",
        });
      }

      const ext = mimeType.split("/")[1]?.replace("+", "") ?? "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin.storage
        .from("apartments")
        .upload(fileName, buffer, {
          contentType: mimeType,
          cacheControl: "3600",
        });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Ошибка загрузки: ${error.message}`,
        });
      }

      const { data } = supabaseAdmin.storage
        .from("apartments")
        .getPublicUrl(fileName);

      return { url: data.publicUrl };
    }),
});
