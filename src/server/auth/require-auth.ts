import type { GetServerSideProps } from 'next';

import { auth } from '@/server/auth';

/**
 * Гард для страниц, доступных только авторизованным: неавторизованного
 * пользователя редиректим на вход ещё на сервере, без «мигания» страницы.
 *
 * Использование: `export const getServerSideProps = requireAuth;`
 */
export const requireAuth: GetServerSideProps = async (ctx) => {
    const session = await auth(ctx);

    if (!session?.user) {
        return { redirect: { destination: '/auth/signin', permanent: false } };
    }

    return { props: {} };
};
