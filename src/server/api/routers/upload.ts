import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getSupabaseAdmin } from "@/server/supabase";

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
      const ext = mimeType.split("/")[1]?.replace("+", "") ?? "jpg";

      const buffer = Buffer.from(base64, "base64");
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
