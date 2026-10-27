import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { ArrowRight, BarChart, Chat, Home, Info, Settings, Shield, Users } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { hasPermission, isAdminRole } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';

// Неавторизованных разворачивает на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function AdminPage() {
    const { data: session } = useSession();

    // ===== Не админ — заглушка (сами данные защищены процедурами на сервере) =====
    if (!isAdminRole(session?.user?.role)) {
        return (
            <AuthGuard>
                <ClientHeader />
                <div className="p-[60px_20px] text-center text-lg">У вас нет доступа</div>
            </AuthGuard>
        );
    }

    // ===== Разделы администрирования (перенесены из профиля, чтобы его разгрузить) =====
    const sections = [
        { href: '/admin/moderation', label: 'Модерация объектов', icon: Shield },
        { href: '/admin/users', label: 'Управление пользователями', icon: Users },
        { href: '/admin/support', label: 'Обращения в поддержку', icon: Info },
        { href: '/admin/conversations', label: 'Все беседы', icon: Chat },
        { href: '/admin/statistics', label: 'Общая статистика', icon: BarChart },
        { href: '/admin/requisites', label: 'Реквизиты сайта', icon: Settings },
        { href: '/admin/add-apartment', label: 'Добавить квартиру', icon: Home },
    ] as const;

    return (
        <AuthGuard>
            <ClientHeader />
            <div className="mx-auto max-w-[1200px] px-4 py-10">
                <h1 className="pb-2 text-[25px] max-md:text-xl">Панель администратора</h1>
                <p className="pb-6 text-sm text-muted-foreground">Все разделы управления сайтом в одном месте.</p>

                {/* Грид карточек: 3 в ряд на десктопе → 2 на планшете → 1 на мобилке */}
                <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
                    {sections.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            // Карточка-раздел: иконка + название + стрелка, занимает свою ячейку грида.
                            className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 font-medium text-foreground no-underline transition-colors hover:border-primary"
                        >
                            <item.icon className="h-8 w-8 shrink-0" />
                            {item.label}
                            <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </Link>
                    ))}
                </div>

                {/* Каталог иконок — только суперадмину (страница тоже проверяет роль на сервере). */}
                {hasPermission(session?.user?.role ?? '', 'superadmin') && (
                    <Link
                        href="/profile/icons"
                        className="group mt-6 flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 font-medium text-foreground no-underline transition-colors hover:border-primary"
                    >
                        Все иконки на проекте
                        <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </Link>
                )}
            </div>
        </AuthGuard>
    );
}
