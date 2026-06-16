import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { apartments } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// Валидация для создания квартиры

const createApartmentSchema = z.object({
  title: z.string().min(3, "Название минимум 3 символа"),
});
