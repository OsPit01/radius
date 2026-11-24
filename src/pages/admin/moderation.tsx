import { useState } from 'react';

import { useSession } from 'next-auth/react';

import { ModerationCard } from '@/components/admin/moderation/ModerationCard';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { isAdminRole, isStaffRole } from '@/lib/constants/roles';
import { EDIT_INPUT_CLASS } from '@/lib/utils';
import { requireAuth } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';
import { api } from '@/trpc/react';

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function ModerationPage() {
    const { data } = api.apartment.getForModeration.useQuery();
    const { data: session } = useSession();
    // Единое поле поиска: цифры → поиск по id, текст → поиск по email владельца.
    const [search, setSearch] = useState('');
    // Выбранный город для фильтра: '' = все города.
    const [cityFilter, setCityFilter] = useState('');

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

    // Список городов для селекта — ТОЛЬКО существующие: собираем из тех же
    // данных модерации (у каждого объекта есть город). Никакого захардкоженного
    // списка: появился объект в новом городе — город появился в селекте сам.
    //Set убирает дубли (Минск из 20 объектов → один Минск), sort — по алфавиту.
    const cities = data
        ? Array.from(new Set(data.map((item) => item.apartment.city).filter(Boolean))).sort((a, b) =>
              a.localeCompare(b, 'ru'),
          )
        : [];

    // ===== УМНЫЙ ПОИСК =====
    // Одно поле — два режима, без переключателя:
    //   введены ТОЛЬКО цифры (id-режим) → точное совпадение по номеру объекта;
    //   есть буквы (email-режим)        → вхождение по email ВЛАДЕЛЬЦА объекта
    //     без учёта регистра (частичное: 'ivanov' найдёт 'ivanov@gmail.com').
    // trim() срезает пробелы по краям — случайно протянутый пробел не ломает поиск.
    const query = search.trim().toLowerCase();
    const isIdSearch = /^\d+$/.test(query);

    // ===== ФИЛЬТРАЦИЯ =====
    // 1) по id ИЛИ email (смотря что ввели);
    // 2) по городу (если выбран — показываем ТОЛЬКО объекты этого города).
    // user?.email — с ?: потому что владелец бывает null (объект-сирота).
    const filteredData = sortedData.filter((item) => {
        const matchesSearch =
            query === '' ||
            (isIdSearch ? String(item.apartment.id) === query : (item.user?.email ?? '').toLowerCase().includes(query));
        const matchesCity = cityFilter === '' || item.apartment.city === cityFilter;
        return matchesSearch && matchesCity;
    });

    if (!isStaffRole(session?.user.role)) {
        return (
            <AuthGuard>
                <Layout> У вас нет доступа </Layout>
            </AuthGuard>
        );
    }
    return (
        <AuthGuard>
            <Layout>
                <h1 className="text-semibold pb-2 text-2xl max-md:text-xl">Модерация объектов</h1>

                {/* ФИЛЬТРЫ: умный поиск + селект города.
                        Селект показывает ТОЛЬКО реально существующие города
                        (собранные из данных выше). Выбрали город → в сетке
                        остаются объекты только этого города. */}
                <div className="mb-5 grid grid-cols-[1fr_220px] gap-3 max-md:grid-cols-1">
                    <input
                        type="text"
                        placeholder="поиск по id или email владельца"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`${EDIT_INPUT_CLASS} w-full`}
                    />
                    <select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="h-[42px] cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
                    >
                        <option value="">Все города</option>
                        {cities.map((city) => (
                            <option
                                key={city}
                                value={city}
                            >
                                {city}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
                    {filteredData.map((item) => (
                        <ModerationCard
                            key={item.apartment.id}
                            item={item}
                            // Полные права (Удалить/Редактировать чужое) — только админ+.
                            // Модератору сервер эти действия запрещает — кнопки не показываем.
                            canManage={isAdminRole(session?.user.role)}
                        />
                    ))}
                </div>
                {(search.trim() !== '' || cityFilter !== '') && filteredData.length === 0 && (
                    <div className="flex justify-center pt-14 max-md:mt-4">
                        <p className="text-2xl text-foreground max-md:text-lg">Ничего не найдено...</p>
                    </div>
                )}
            </Layout>
        </AuthGuard>
    );
}
