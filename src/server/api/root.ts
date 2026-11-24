import { createCallerFactory, createTRPCRouter } from '@/server/api/trpc';

import { analyticsRouter } from './routers/analytics';
import { apartmentRouter } from './routers/apartment';
import { bookingsRouter } from './routers/bookings';
import { chatRouter } from './routers/chat';
import { favoritesRouter } from './routers/favorites';
import { geoRouter } from './routers/geo';
import { infoBlockRouter } from './routers/info-block';
import { notificationRouter } from './routers/notification';
import { requisitesRouter } from './routers/requisites';
import { supportRouter } from './routers/support';
import { uploadRouter } from './routers/upload';
import { userRouter } from './routers/user';
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
    chat: chatRouter,
    analytics: analyticsRouter,
    support: supportRouter,
    infoBlock: infoBlockRouter,
    requisites: requisitesRouter,
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
