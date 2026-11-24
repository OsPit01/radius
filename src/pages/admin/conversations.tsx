import { useSession } from 'next-auth/react';

import { ConversationCard } from '@/components/admin/conversations/ConversationCard';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { isAdminRole } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';
import { api } from '@/trpc/react';
// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function ConversationsPage() {
    const { data: session } = useSession();
    const { data: conversations } = api.chat.adminList.useQuery();

    if (!isAdminRole(session?.user?.role)) {
        return (
            <Layout>
                <AccessDenied />
            </Layout>
        );
    }

    return (
        <Layout>
            <h1 className="text-semibold pb-2 text-2xl max-md:text-xl">Все беседы</h1>
            <p className="pb-6 text-sm text-muted-foreground">
                Переписка арендаторов и владельцев: блокировка и удаление.
            </p>

            {conversations?.length === 0 && (
                <p className="py-16 text-center text-muted-foreground">Пока нет ни одной беседы</p>
            )}

            <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
                {conversations?.map((item) => (
                    <ConversationCard
                        key={item.conversation.id}
                        item={item}
                    />
                ))}
            </div>
        </Layout>
    );
}
