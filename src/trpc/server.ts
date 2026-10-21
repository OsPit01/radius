import type { GetServerSidePropsContext } from 'next';

import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

/**
 * Серверный вызыватель tRPC для getServerSideProps:
 * ходит в роутеры напрямую, без HTTP, с сессией из cookies запроса.
 *
 * Импортировать только из getServerSideProps / API routes.
 */
export async function createServerCaller(ctx: Pick<GetServerSidePropsContext, 'req' | 'res'>) {
    return appRouter.createCaller(await createTRPCContext({ req: ctx.req, res: ctx.res }));
}
