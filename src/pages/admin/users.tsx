import { useEffect, useState } from 'react';

import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

import { UserCard } from '@/components/admin/users/UserCard';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { getRoleInfo, isAdminRole, ROLE_OPTIONS } from '@/lib/constants/roles';
import { INPUT_CLASS } from '@/lib/utils';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';
// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function Users() {
    const { data: session } = useSession();
    const router = useRouter();
    const [activeRole, setActiveRole] = useState<string>('all');
    // ?query=... из URL (например, из обращения в поддержке) — сразу подставляем в поиск.
    const initialQuery = (router.query.query as string) ?? '';
    const [query, setQuery] = useState<string>(initialQuery);
    const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);

    // Не дёргаем БД на каждую букву: ждём 300 мс паузы в печати.
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const { data: users, isLoading } = api.user.getAll.useQuery({
        query: debouncedQuery.trim() || undefined,
    });

    const roleTabs = [{ id: 'all', label: 'Все' }, ...ROLE_OPTIONS.map((o) => ({ id: o.value, label: o.label }))];

    // Поиск делает сервер. Вкладки — клиентский фасет, действуют только при пустом поиске.
    const searching = query.trim() !== '';
    const visibleUsers = (users ?? []).filter((user) => searching || activeRole === 'all' || user.role === activeRole);

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
                    <div className="mb-4">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Поиск по email или id"
                            className={INPUT_CLASS}
                        />
                    </div>
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
