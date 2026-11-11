import { useState } from 'react';

import { Eye } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { getRoleInfo, type RoleKey } from '@/lib/constants/roles';
import { getRoleColor } from '@/lib/theme';
import { api } from '@/trpc/react';

import {
    BanUserModal,
    type EditUserForm,
    EditUserModal,
    type NotifyForm,
    NotifyUserModal,
    UserObjectsModal,
} from './UserCardModals';

type AdminUser = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    patronymic: string | null;
    phone: string | null;
    email: string;
    image: string | null;
    role: string;
};

type UserCardProps = {
    user: AdminUser;
    allowedRoles: { value: string; label: string }[];
};

/**
 * Компактная карточка пользователя в админке (4 колонки на десктопе).
 * Здесь — состояние, мутации и сама карточка; модалки (редактирование,
 * бан, уведомление, объекты) вынесены в UserCardModals.
 * Минимум шрифта — 11px: мельче уже не читается.
 */
export function UserCard({ user, allowedRoles }: UserCardProps) {
    const roleInfo = getRoleInfo(user.role);

    const [selectedRole, setSelectedRole] = useState<RoleKey | ''>('');
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<EditUserForm>({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        patronymic: user.patronymic ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
    });

    const [banOpen, setBanOpen] = useState(false);
    const [banDays, setBanDays] = useState(7);

    const [notifyOpen, setNotifyOpen] = useState(false);
    const [notifyForm, setNotifyForm] = useState<NotifyForm>({ title: '', text: '' });
    const [objectsOpen, setObjectsOpen] = useState(false);
    const [showId, setShowId] = useState(false);
    const utils = api.useUtils();

    const updateRole = api.user.updateRole.useMutation({
        onSuccess: () => {
            void utils.user.getAll.invalidate();
        },
        onError: (error) => {
            alert(error.message);
        },
    });

    const updateUser = api.user.adminUpdateUser.useMutation({
        onSuccess: () => {
            void utils.user.getAll.invalidate();
            setEditOpen(false);
        },
        onError: (error) => {
            alert(error.message);
        },
    });

    const banUser = api.user.banUser.useMutation({
        onSuccess: () => {
            void utils.user.getAll.invalidate();
            setBanOpen(false);
        },
        onError: (error) => {
            alert(error.message);
        },
    });

    // Админ отправляет уведомление пользователю.
    const notifyUser = api.notification.notifyUser.useMutation({
        onSuccess: () => {
            setNotifyOpen(false);
            setNotifyForm({ title: '', text: '' });
        },
        onError: (error) => {
            alert(error.message);
        },
    });

    // Объекты пользователя (подгружаем только когда модалка открыта).
    const { data: userObjects } = api.apartment.getByUser.useQuery({ userId: user.id }, { enabled: objectsOpen });

    const handleSave = () => {
        updateUser.mutate({
            userId: user.id,
            firstName: editForm.firstName || undefined,
            lastName: editForm.lastName || undefined,
            patronymic: editForm.patronymic || undefined,
            email: editForm.email || undefined,
            phone: editForm.phone || undefined,
        });
    };

    return (
        <>
            <div className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary">
                {/* Шапка: аватар + имя + email + id */}
                <div className="flex items-center gap-2.5">
                    <Avatar
                        src={user.image}
                        name={user.firstName ?? user.email}
                        size={40}
                    />
                    <div className="min-w-0">
                        {/* truncate: длинные имя/email обрезаются, карточка не раздувается. */}
                        <p className="truncate text-sm font-semibold text-foreground">{user.firstName ?? user.email}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-1">
                            <p
                                className="truncate text-[11px] text-muted-foreground"
                                title={user.id}
                            >
                                ID: {showId ? user.id : `${user.id.slice(0, 8)}…`}
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowId((visible) => !visible)}
                                aria-label={showId ? 'Скрыть ID' : 'Показать ID'}
                                className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <Eye className="size-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Бейдж роли: цвет — из слоя оформления (getRoleColor),
                    текст — из домена (getRoleInfo). Разделение ответственности. */}
                <span
                    style={{ background: getRoleColor(user.role) }}
                    className="mt-3 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase"
                >
                    {roleInfo.label}
                </span>

                {/* Смена роли */}
                <div className="mt-3 flex items-center gap-2">
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as RoleKey)}
                        className="h-8 min-w-0 flex-1 cursor-pointer rounded-lg border border-border bg-card px-2 text-xs text-foreground outline-none focus:border-primary"
                    >
                        <option value="">Выбрать роль...</option>
                        {allowedRoles.map((r) => (
                            <option
                                key={r.value}
                                value={r.value}
                            >
                                {r.label}
                            </option>
                        ))}
                    </select>
                    <button
                        className="h-8 shrink-0 cursor-pointer rounded-[30px] bg-foreground px-3 text-xs font-medium text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                            if (!selectedRole) {
                                return;
                            }
                            updateRole.mutate({ userId: user.id, role: selectedRole });
                        }}
                        disabled={!selectedRole || updateRole.isPending}
                    >
                        Сохранить
                    </button>
                </div>

                {/* Действия: 2×2 — компактно, но кнопки читаются (12px) */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setEditOpen(true)}
                        className="cursor-pointer rounded-[30px] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                        Редактировать
                    </button>
                    <button
                        onClick={() => setBanOpen(true)}
                        className="cursor-pointer rounded-[30px] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                    >
                        Забанить
                    </button>
                    <button
                        onClick={() => setNotifyOpen(true)}
                        className="cursor-pointer rounded-[30px] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                        Уведомить
                    </button>
                    <button
                        onClick={() => setObjectsOpen(true)}
                        className="cursor-pointer rounded-[30px] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                        Объекты
                    </button>
                </div>
            </div>

            {/* Модалки: состояние и мутации живут ЗДЕСЬ (родитель),
                сами модалки только показывают и отдают действия наверх. */}
            <EditUserModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                form={editForm}
                onFieldChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
                onSave={handleSave}
                isSaving={updateUser.isPending}
            />
            <BanUserModal
                open={banOpen}
                onClose={() => setBanOpen(false)}
                userName={user.firstName ?? user.email}
                days={banDays}
                onDaysChange={setBanDays}
                onBan={() => banUser.mutate({ userId: user.id, days: banDays })}
                isPending={banUser.isPending}
            />
            <NotifyUserModal
                open={notifyOpen}
                onClose={() => setNotifyOpen(false)}
                form={notifyForm}
                onFieldChange={(field, value) => setNotifyForm((prev) => ({ ...prev, [field]: value }))}
                onSend={() =>
                    notifyUser.mutate({
                        userId: user.id,
                        title: notifyForm.title.trim(),
                        text: notifyForm.text.trim(),
                    })
                }
                isSending={notifyUser.isPending}
            />
            <UserObjectsModal
                open={objectsOpen}
                onClose={() => setObjectsOpen(false)}
                objects={userObjects}
            />
        </>
    );
}
