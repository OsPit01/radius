import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as schema from '@/server/db/schema';
import { rateLimit } from '@/server/db/schema';

type Database = PostgresJsDatabase<typeof schema>;

/**
 * Защита от флуда: ограничивает число вызовов одного ключа за окно времени.
 *
 * Как работает «под капотом»: у каждого ключа (например `booking:{userId}`)
 * в таблице `rate_limit` есть счётчик `count` и момент сброса `resetAt`.
 * Пока `resetAt` в будущем — счётчик наращивается; как только окно прошло —
 * счётчик сбрасывается и начинается новый период.
 *
 * @param key     уникальный ключ (включает в себя действие и пользователя)
 * @param limit   максимум вызовов за одно окно
 * @param windowMs длина окна в миллисекундах
 */
export async function enforceRateLimit(db: Database, key: string, limit: number, windowMs: number): Promise<void> {
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);

    const [row] = await db.select().from(rateLimit).where(eq(rateLimit.key, key));

    if (!row) {
        await db.insert(rateLimit).values({ key, count: 1, resetAt });
        return;
    }

    if (row.resetAt.getTime() <= now.getTime()) {
        await db.update(rateLimit).set({ count: 1, resetAt }).where(eq(rateLimit.key, key));
        return;
    }

    if (row.count >= limit) {
        throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Слишком много запросов. Попробуйте позже.',
        });
    }

    await db
        .update(rateLimit)
        .set({ count: row.count + 1 })
        .where(eq(rateLimit.key, key));
}
