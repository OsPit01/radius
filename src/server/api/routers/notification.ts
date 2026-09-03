import { notification } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { count, and, eq } from "drizzle-orm";

export const notificationRouter = createTRPCRouter({
  getMyListNotification: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db
      .select({ count: count() })
      .from(notification)
      .where(
        and(eq(notification.userId, userId), eq(notification.isRead, false)),
      )
      .then((rows) => rows[0]?.count ?? 0);
  }),
});
