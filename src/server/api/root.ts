import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { apartmentRouter } from "./routers/apartment";
import { userRouter } from "./routers/user";
import { favoritesRouter } from "./routers/favorites";
import { uploadRouter } from "./routers/upload";
import { notificationRouter } from "./routers/notification";
import { bookingsRouter } from "./routers/bookings";
import { geoRouter } from "./routers/geo";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  apartment: apartmentRouter,
  user: userRouter,
  favorites: favoritesRouter,
  upload: uploadRouter,
  notification: notificationRouter,
  bookings: bookingsRouter,
  geo: geoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
