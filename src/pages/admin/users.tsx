import { useEffect, useState } from 'react';

import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

import { UserCard } from '@/components/admin/users/UserCard';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { getRoleInfo, isAdminRole, ROLE_OPTIONS } from '@/lib/constants/roles';
import { INPUT_CLASS } from '@/lib/utils';
import { requireAuth } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';
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
            <AuthGuard>
                <Layout>
                    <AccessDenied />
                </Layout>
            </AuthGuard>
        );
    }

    const myLevel = getRoleInfo(session?.user?.role ?? '').level;
    const allowedRoles = ROLE_OPTIONS.filter((o) => getRoleInfo(o.value).level < myLevel);

    return (
        <AuthGuard>
            <Layout>
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
                <SegmentedTabs
                    tabs={roleTabs}
                    active={activeRole}
                    onChange={setActiveRole}
                    className="mb-8 flex-wrap justify-center gap-x-3 gap-y-0 sm:gap-x-6 [&>button]:m-0 [&>button]:min-h-11 [&>button]:px-2 [&>button]:py-2 sm:[&>button]:px-4"
                />
                <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
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
            </Layout>
        </AuthGuard>
    );
}
