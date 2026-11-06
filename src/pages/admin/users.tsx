import { useState } from 'react';

import { useSession } from 'next-auth/react';

import { UserCard } from '@/components/admin/users/UserCard';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { getRoleInfo, isAdminRole, ROLE_OPTIONS } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';
// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function Users() {
    const { data: session } = useSession();
    const { data: users, isLoading } = api.user.getAll.useQuery();
    const [activeRole, setActiveRole] = useState<string>('all');
    const roleTabs = [{ id: 'all', label: 'Все' }, ...ROLE_OPTIONS.map((o) => ({ id: o.value, label: o.label }))];
    const visibleUsers = (users ?? []).filter((user) => activeRole === 'all' || user.role === activeRole);
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
                    <div className="mb-8">
                        <SegmentedTabs
                            tabs={roleTabs}
                            active={activeRole}
                            onChange={setActiveRole}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
                        {visibleUsers.map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                allowedRoles={allowedRoles}
                            />
                        ))}
                    </div>
                    {isLoading && <p className="text-center text-muted-foreground">Загрузка...</p>}

                    {!isLoading && visibleUsers.length === 0 && (
                        <p className="text-center text-muted-foreground">Ничего не найдено</p>
                    )}
                </div>
            </AuthGuard>
        </>
    );
}
