import { useSession } from 'next-auth/react';

import { BarChart, Chat, Home, type IconComponent, Info, Settings, Shield, Users } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { TileLink } from '@/components/ui/TileLink';
import { hasPermission, isStaffRole, type RoleKey } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';

// Неавторизованных разворачивает на вход ещё на сервере
export const getServerSideProps = requireAuth;

// ===== Разделы панели =====
// minRole — минимальная роль для раздела:
//   'moderator' — модерация контента (персоналу),
//   'admin'     — полное управление (пользователи, поддержка, статистика...).
// hasPermission сравнивает УРОВНИ (см. roles.ts), поэтому список не пишем руками.
// Массив статичный — не зависит от сессии и данных, поэтому живёт на уровне модуля
// (как TIME_OPTIONS / SUPPORTED_IMAGE_TYPES в других файлах): создаётся один раз
// при загрузке файла, а не пересобирается заново при каждом рендере страницы.
const SECTIONS: readonly { href: string; label: string; icon: IconComponent; minRole: RoleKey }[] = [
    { href: '/admin/moderation', label: 'Модерация объектов', icon: Shield, minRole: 'moderator' },
    { href: '/admin/users', label: 'Управление пользователями', icon: Users, minRole: 'admin' },
    { href: '/admin/support', label: 'Обращения в поддержку', icon: Info, minRole: 'admin' },
    { href: '/admin/conversations', label: 'Все беседы', icon: Chat, minRole: 'admin' },
    { href: '/admin/statistics', label: 'Общая статистика', icon: BarChart, minRole: 'admin' },
    { href: '/admin/requisites', label: 'Реквизиты сайта', icon: Settings, minRole: 'admin' },
    { href: '/admin/add-apartment', label: 'Добавить квартиру', icon: Home, minRole: 'admin' },
];

export default function AdminPage() {
    const { data: session } = useSession();
    const role = session?.user?.role ?? '';

    // ===== Ворота панели: ПЕРСОНАЛ (модератор и выше) =====
    // Хаб открыт модератору, но разделы внутри фильтруются по minRole:
    // модератор видит только «Модерацию объектов», админ+ — всё.
    // (Данные дополнительно защищены процедурами на сервере — двойная защита.)
    if (!isStaffRole(role)) {
        return (
            <AuthGuard>
                <ClientHeader />
                <div className="p-[60px_20px] text-center text-lg">У вас нет доступа</div>
            </AuthGuard>
        );
    }

    // Модератору показываем только его разделы; админу+ — все.
    // Сам список — SECTIONS на уровне модуля; здесь только фильтрация по роли.
    const visibleSections = SECTIONS.filter((item) => hasPermission(role, item.minRole));

    return (
        <AuthGuard>
            <ClientHeader />
            <div className="mx-auto max-w-[1200px] px-4 py-10">
                <h1 className="pb-2 text-[25px] max-md:text-xl">Панель управления</h1>
                <p className="pb-6 text-sm text-muted-foreground">
                    {hasPermission(role, 'admin')
                        ? 'Все разделы управления сайтом в одном месте.'
                        : 'Разделы модерации контента.'}
                </p>

                {/* Грид карточек: 3 в ряд на десктопе → 2 на планшете → 1 на мобилке.
                    Плитки — общий компонент TileLink: единый стиль с личным кабинетом */}
                <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
                    {visibleSections.map((item) => (
                        <TileLink
                            key={item.href}
                            href={item.href}
                            label={item.label}
                            icon={item.icon}
                        />
                    ))}
                </div>

                {/* Каталог иконок — только суперадмину (страница тоже проверяет роль на сервере). */}
                {hasPermission(role, 'superadmin') && (
                    <TileLink
                        href="/profile/icons"
                        label="Все иконки на проекте"
                        className="mt-6"
                    />
                )}
            </div>
        </AuthGuard>
    );
}
