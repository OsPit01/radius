import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '@/env';

import * as schema from './schemas';

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
};

// Дев и прод делят ОДНУ базу (Supabase session-pooler: всего 15 слотов на всех).
// Чтобы запущенный локально `npm run dev` не съедал пул и не клал прод
// (500-е на каталоге + петля входа), в разработке ограничиваем аппетит:
// максимум 2 соединения, простаивающие закрываются через 20 секунд.
// В проде — стандартные настройки пула postgres.js (max 10, без таймаута).
const isDev = env.NODE_ENV !== 'production';
const conn =
    globalForDb.conn ??
    postgres(env.DATABASE_URL, {
        max: isDev ? 2 : undefined,
        idle_timeout: isDev ? 20 : undefined,
    });
if (env.NODE_ENV !== 'production') {
    globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });
