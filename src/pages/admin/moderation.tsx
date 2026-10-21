import { useState } from 'react';

import { useSession } from 'next-auth/react';

import { ModerationCard } from '@/components/admin/moderation/ModerationCard';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { isAdminRole } from '@/lib/constants/roles';
import { EDIT_INPUT_CLASS } from '@/lib/utils';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function ModerationPage() {
    const { data } = api.apartment.getForModeration.useQuery();
    const { data: session } = useSession();
    const [searchId, setSearchId] = useState('');

    // ===== ПРИОРИТЕТ СТАТУСОВ =====
    const priority: Record<string, number> = {
        moderation: 0, // Сначала на модерации
        active: 1, // Потом активные
        inactive: 2, // Потом неактивные
    };
    // ===== СОРТИРУЕМ ДАННЫЕ (если они есть) =====
    const sortedData = data
        ? [...data].sort((a, b) => {
              const priorityA = priority[a.apartment.status] ?? 999;
              const priorityB = priority[b.apartment.status] ?? 999;
              return priorityA - priorityB;
          })
        : [];
    const filteredData =
        searchId.trim() === ''
            ? sortedData
            : sortedData.filter((item) => String(item.apartment.id) === searchId.trim());

    if (!isAdminRole(session?.user.role)) {
        return (
            <AuthGuard>
                <ClientHeader />
                <div className="p-[60px_20px] text-center text-lg"> У вас нет доступа </div>
            </AuthGuard>
        );
    }
    return (
        <>
            <AuthGuard>
                <ClientHeader />

                <div className="mx-auto max-w-[1200px] px-4 py-10">
                    {/* ПОИСК ПО ID (INPUT) */}
                    <div className="mb-5">
                        <input
                            type="text"
                            placeholder="поиск по id"
                            inputMode="numeric"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value.replace(/\D/g, ''))}
                            className={`${EDIT_INPUT_CLASS} w-full`}
                        />
                    </div>
                    <h1 className="text-semibold pb-2 text-[25px] max-md:text-xl">Модерация объектов</h1>

                    <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
                        {filteredData.map((item) => (
                            <ModerationCard
                                key={item.apartment.id}
                                item={item}
                            />
                        ))}
                    </div>
                    {searchId.trim() !== '' && filteredData.length === 0 && (
                        <div className="flex justify-center pt-14 max-md:mt-4">
                            <p className="text-2xl text-black max-md:text-lg">Ничего не найдено...</p>
                        </div>
                    )}
                </div>
            </AuthGuard>
        </>
    );
}
