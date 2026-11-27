import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as schema from '@/server/db/schemas';

type Database = PostgresJsDatabase<typeof schema>;

/**
 * Защита от флуда: ограничивает число вызовов одного ключа за окно времени.
 *
 * Как работает «под капотом»: у каждого ключа (например `booking:{userId}`)
 * в таблице `rate_limit` есть счётчик `count` и момент сброса `resetAt`.
 * Пока `resetAt` в будущем — счётчик наращивается; как только окно прошло —
 * счётчик сбрасывается и начинается новый период.
 *
 * Реализация — ОДИН атомарный INSERT ... ON CONFLICT: старый вариант
 * (SELECT → INSERT или UPDATE count+1) страдал от гонок:
 * 1) два параллельных ПЕРВЫХ запроса оба вставляли строку — второй падал
 *    с PK-violation (пользователь видел 500 вместо «слишком много запросов»);
 * 2) два параллельных запроса читали один count и оба писали count+1 —
 *    потерянные обновления растягивали лимит вдвое-втрое.
 * Атомарный upsert делает проверку и инкремент одной операцией БД.
 *
 * @param key     уникальный ключ (включает в себя действие и пользователя)
 * @param limit   максимум вызовов за одно окно
 * @param windowMs длина окна в миллисекундах
 */
export async function enforceRateLimit(db: Database, key: string, limit: number, windowMs: number): Promise<void> {
    const resetAt = new Date(Date.now() + windowMs);

    // ВАЖНО 1: колонки в БД — camelCase (проект без snake_case), поэтому
    // в сыром SQL пишем "resetAt" в кавычках.
    // ВАЖНО 2: параметры дат передаём СТРОКОЙ ISO + явный каст ::timestamptz.
    // Сырой SQL не знает типы колонок (в отличие от типизованных drizzle-
    // билдеров), и «голый» Date-параметр ломал prepared-запрос postgres-js
    // (TypeError в Bind), а строка без каста — тип Postgres не выводил
    // (could not determine data type of parameter). Каст закрывает оба случая.
    const resetAtIso = resetAt.toISOString();

    // Дженерик db.execute — тип ОДНОЙ строки; вернётся массив строк.
    const rows = await db.execute<{ count: number }>(sql`
        INSERT INTO radius_rate_limit (key, count, "resetAt")
        VALUES (${key}, 1, ${resetAtIso}::timestamptz)
        ON CONFLICT (key) DO UPDATE SET
            count = CASE
                WHEN radius_rate_limit."resetAt" <= now() THEN 1
                ELSE radius_rate_limit.count + 1
            END,
            "resetAt" = CASE
                WHEN radius_rate_limit."resetAt" <= now() THEN ${resetAtIso}::timestamptz
                ELSE radius_rate_limit."resetAt"
            END
        RETURNING count
    `);

    // RETURNING вернул итоговый счётчик окна: > limit = вызов уже лишний.
    if ((rows[0]?.count ?? 0) > limit) {
        throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Слишком много запросов. Попробуйте позже.',
        });
    }
}
