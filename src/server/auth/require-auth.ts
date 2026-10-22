import type { GetServerSideProps } from 'next';

import { hasPermission, type RoleKey } from '@/lib/constants/roles';
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

/**
 * Гард для страниц с ограничением по роли (проверка на сервере, поэтому работает и на проде).
 * Неавторизованного отправляем на вход, а тому, кому роли не хватает, отдаём обычный 404 —
 * чтобы закрытая страница не выдавала самого факта своего существования.
 *
 * Использование: `export const getServerSideProps = requireRole('superadmin');`
 */
export function requireRole(role: RoleKey): GetServerSideProps {
    return async (ctx) => {
        const session = await auth(ctx);

        if (!session?.user) {
            return { redirect: { destination: '/auth/signin', permanent: false } };
        }
        if (!hasPermission(session.user.role, role)) {
            return { notFound: true };
        }

        return { props: {} };
    };
}
