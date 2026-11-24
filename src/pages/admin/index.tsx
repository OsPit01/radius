import { useSession } from 'next-auth/react';

import { BarChart, Chat, Home, type IconComponent, Info, Note, Settings, Shield, Users } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { TileLink } from '@/components/ui/TileLink';
import { canAccessAdminPanel, canManageRequisites, hasPermission, type RoleKey } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';

// Неавторизованных разворачивает на вход ещё на сервере
export const getServerSideProps = requireAuth;

// ===== Разделы панели =====
// minRole — минимальная роль для раздела по УРОВНЮ (hasPermission сравнивает уровни).
// canAccess — ТОЧЕЧНОЕ право для ролей вне иерархии (legalAdmin: реквизиты).
// Массив статичный — не зависит от сессии и данных, поэтому живёт на уровне модуля.
const SECTIONS: readonly {
    href: string;
    label: string;
    icon: IconComponent;
    minRole: RoleKey;
    canAccess?: (role: string) => boolean;
}[] = [
    { href: '/admin/moderation', label: 'Модерация объектов', icon: Shield, minRole: 'moderator' },
    { href: '/admin/info-blocks', label: 'Блоки информации', icon: Note, minRole: 'moderator' },
    { href: '/admin/users', label: 'Управление пользователями', icon: Users, minRole: 'admin' },
    { href: '/admin/support', label: 'Обращения в поддержку', icon: Info, minRole: 'admin' },
    { href: '/admin/conversations', label: 'Все беседы', icon: Chat, minRole: 'admin' },
    { href: '/admin/statistics', label: 'Общая статистика', icon: BarChart, minRole: 'admin' },
    {
        href: '/admin/requisites',
        label: 'Реквизиты сайта',
        icon: Settings,
        minRole: 'superadmin',
        // Точечное право: legalAdmin (level 0) не проходит hasPermission,
        // но реквизиты — его раздел. Проверка — единый источник правды.
        canAccess: (role) => canManageRequisites(role),
    },
    { href: '/my-apartments/new', label: 'Добавить квартиру', icon: Home, minRole: 'admin' },
];

export default function AdminPage() {
    const { data: session } = useSession();
    const role = session?.user?.role ?? '';

    // ===== Ворота панели: ПЕРСОНАЛ (модератор+) + legalAdmin =====
    if (!canAccessAdminPanel(role)) {
        return (
            <AuthGuard>
                <Layout>
                    <AccessDenied />
                </Layout>
            </AuthGuard>
        );
    }

    // Раздел виден, если роль проходит по уровню (hasPermission) ИЛИ
    // по точечному праву (canAccess — для legalAdmin и будущих спецролей).
    // legalAdmin видит ВСЕ вкладки (обзор панели), но операции внутри
    // запрещены процедурами (они проверяют isStaffRole/isAdminRole).
    const visibleSections =
        role === 'legalAdmin'
            ? SECTIONS
            : SECTIONS.filter((item) => hasPermission(role, item.minRole) || (item.canAccess?.(role) ?? false));

    return (
        <AuthGuard>
            <Layout className="max-w-[1200px]! px-4! py-10!">
                <h1 className="pb-2 text-2xl max-md:text-xl">Панель управления</h1>
                <p className="pb-6 text-sm text-muted-foreground">
                    {hasPermission(role, 'admin')
                        ? 'Все разделы управления сайтом в одном месте.'
                        : role === 'legalAdmin'
                          ? 'Просмотр разделов управления. Изменения доступны только в «Реквизитах сайта».'
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
            </Layout>
        </AuthGuard>
    );
}
