import "server-only";

import { cache } from "react";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

// ВРЕМЕННО: отключаем server-side tRPC

export const api = appRouter;

export function HydrateClient({ children }: { children: React.ReactNode }) {
  return children;
}
