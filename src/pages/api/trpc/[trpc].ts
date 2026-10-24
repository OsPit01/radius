import { createNextApiHandler } from '@trpc/server/adapters/next';

import { env } from '@/env';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

/**
 * Лимит тела запроса. В Pages Router он по умолчанию 1 МБ, а картинки
 * (до 15 МБ) уходят сюда как base64 data-URL (+~33% = ~20 МБ), поэтому поднимаем его.
 */
export const config = {
    api: { bodyParser: { sizeLimit: '25mb' } },
};

/**
 * Создаёт контекст tRPC для HTTP-запросов (например, из клиентских компонентов).
 */
export default createNextApiHandler({
    router: appRouter,
    createContext: ({ req, res }) => createTRPCContext({ req, res }),
    onError:
        env.NODE_ENV === 'development'
            ? ({ path, error }) => {
                  console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
              }
            : undefined,
});
