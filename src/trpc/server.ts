import "server-only";

import { cache } from "react";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

// ===== СОЗДАЁМ КЭШИРОВАННЫЙ ВЫЗЫВАТЕЛЬ =====
export const api = cache(async () => {
  const ctx = await createTRPCContext({ headers: new Headers() });
  return appRouter.createCaller(ctx);
});

// ===== ДЛЯ ПРОСТЫХ ВЫЗОВОВ (ЕСЛИ НЕ ХОЧЕШЬ AWAIT) =====
export const caller = cache(async () => {
  const ctx = await createTRPCContext({ headers: new Headers() });
  return appRouter.createCaller(ctx);
});
