import { useSession } from 'next-auth/react';

import { UserCard } from '@/components/admin/users/UserCard';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { getRoleInfo, isAdminRole, ROLE_OPTIONS } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function Users() {
    const { data: session } = useSession();
    const { data: users } = api.user.getAll.useQuery();

    if (!isAdminRole(session?.user?.role)) {
        return (
            <>
                <AuthGuard>
                    <ClientHeader />
                    <div className="p-[60px_20px] text-center text-lg">У ВАС НЕТ ДОСТУПА!</div>
                </AuthGuard>
            </>
        );
    }

    const myLevel = getRoleInfo(session?.user?.role ?? '').level;
    const allowedRoles = ROLE_OPTIONS.filter((o) => getRoleInfo(o.value).level < myLevel);

    return (
        <>
            <AuthGuard>
                <ClientHeader />
                <div className="mx-auto max-w-[1200px] px-5 py-10 max-md:px-4">
                    <h1 className="mb-8 text-2xl font-bold text-foreground">Управление пользователями</h1>
                    <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
                        {users?.map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                allowedRoles={allowedRoles}
                            />
                        ))}
                    </div>
                </div>
            </AuthGuard>
        </>
    );
}
