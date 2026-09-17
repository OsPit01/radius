import { z } from "zod";
import { and, ilike } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { streets } from "@/server/db/schema";

export const geoRouter = createTRPCRouter({
  searchStreets: publicProcedure
    .input(
      z.object({
        query: z.string().trim().min(1).max(100),
        location: z.string().trim().max(100).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const nameCond = ilike(streets.name, `%${input.query}%`);

      // Сначала ищем по выбранному городу
      if (input.location) {
        const byCity = await ctx.db
          .select({ name: streets.name })
          .from(streets)
          .where(and(nameCond, ilike(streets.city, `%${input.location}%`)))
          .limit(20);
        if (byCity.length > 0) {
          return Array.from(new Set(byCity.map((r) => r.name))).slice(0, 8);
        }
      }

      // Если по городу пусто (или город не передан) — ищем по всем улицам
      const all = await ctx.db
        .select({ name: streets.name })
        .from(streets)
        .where(nameCond)
        .limit(20);

      return Array.from(new Set(all.map((r) => r.name))).slice(0, 8);
    }),
});
