import { useState } from 'react';

import Link from 'next/link';

import { Modal } from '@/components/ui/Modal';
import { getRoleInfo, type RoleKey } from '@/lib/constants/roles';
import { api } from '@/trpc/react';

type AdminUser = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    patronymic: string | null;
    phone: string | null;
    email: string;
    role: string;
};

type UserCardProps = {
    user: AdminUser;
    allowedRoles: { value: string; label: string }[];
};

export function UserCard({ user, allowedRoles }: UserCardProps) {
    const roleInfo = getRoleInfo(user.role);
    const initial = (user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase();

    const [selectedRole, setSelectedRole] = useState<RoleKey | ''>('');
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        patronymic: user.patronymic ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
    });

    const [banOpen, setBanOpen] = useState(false);
    const [banDays, setBanDays] = useState(7);

    const [notifyOpen, setNotifyOpen] = useState(false);
    const [notifyForm, setNotifyForm] = useState({ title: '', text: '' });
    const [objectsOpen, setObjectsOpen] = useState(false);

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

    const inputClass =
        'w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm text-[#222] outline-none focus:border-[#b552c7]';

    return (
        <>
            <div className="flex flex-col rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                {/* Шапка: аватар + имя + email */}
                <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#b552c7] text-xl font-bold text-white">
                        {initial}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-[#222]">{user.firstName ?? user.email}</p>
                        <p className="truncate text-sm text-[#666]">{user.email}</p>
                    </div>
                </div>

                {/* Бейдж роли */}
                <span
                    style={{ background: roleInfo.color }}
                    className="mt-4 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase"
                >
                    {roleInfo.label}
                </span>

                {/* Смена роли */}
                <div className="mt-4 flex items-center gap-2">
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as RoleKey)}
                        className="flex-1 cursor-pointer rounded-lg border border-[#ddd] bg-white px-3 py-2 text-sm text-[#222] outline-none focus:border-[#b552c7]"
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
                        className="cursor-pointer rounded-[30px] bg-gray-800 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
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

                {/* Кнопки: Редактировать + Забанить */}
                <div className="mt-2 flex gap-2">
                    <button
                        onClick={() => setEditOpen(true)}
                        className="flex-1 cursor-pointer rounded-[30px] border border-[#e5e5e5] px-5 py-2 text-sm font-medium text-[#666] transition-colors hover:border-[#b552c7] hover:text-[#b552c7]"
                    >
                        Редактировать
                    </button>
                    <button
                        onClick={() => setBanOpen(true)}
                        className="flex-1 cursor-pointer rounded-[30px] border border-[#e5e5e5] px-5 py-2 text-sm font-medium text-[#666] transition-colors hover:border-red-400 hover:text-red-500"
                    >
                        Забанить
                    </button>
                </div>

                {/* Кнопки: Уведомить + Объекты */}
                <div className="mt-2 flex gap-2">
                    <button
                        onClick={() => setNotifyOpen(true)}
                        className="flex-1 cursor-pointer rounded-[30px] border border-[#e5e5e5] px-5 py-2 text-sm font-medium text-[#666] transition-colors hover:border-[#b552c7] hover:text-[#b552c7]"
                    >
                        Уведомить
                    </button>
                    <button
                        onClick={() => setObjectsOpen(true)}
                        className="flex-1 cursor-pointer rounded-[30px] border border-[#e5e5e5] px-5 py-2 text-sm font-medium text-[#666] transition-colors hover:border-[#b552c7] hover:text-[#b552c7]"
                    >
                        Объекты
                    </button>
                </div>
            </div>

            {/* Модалка редактирования */}
            <Modal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                title="Редактировать пользователя"
            >
                <div className="flex flex-col gap-3">
                    <input
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        placeholder="Имя"
                        className={inputClass}
                    />
                    <input
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        placeholder="Фамилия"
                        className={inputClass}
                    />
                    <input
                        value={editForm.patronymic}
                        onChange={(e) => setEditForm({ ...editForm, patronymic: e.target.value })}
                        placeholder="Отчество"
                        className={inputClass}
                    />
                    <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="Email"
                        className={inputClass}
                    />
                    <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="Телефон"
                        className={inputClass}
                    />
                    <button
                        onClick={handleSave}
                        disabled={updateUser.isPending}
                        className="mt-2 cursor-pointer rounded-[30px] bg-gray-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                    >
                        {updateUser.isPending ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </Modal>

            {/* Модалка бана */}
            <Modal
                open={banOpen}
                onClose={() => setBanOpen(false)}
                title="Забанить пользователя"
            >
                <div className="flex flex-col gap-3">
                    <p className="text-sm text-[#666]">{user.firstName ?? user.email}</p>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-[#333]">
                        На сколько дней?
                        <input
                            type="number"
                            min={1}
                            max={3650}
                            value={banDays}
                            onChange={(e) => setBanDays(Math.max(1, Math.min(3650, Number(e.target.value))))}
                            className={inputClass}
                        />
                    </label>
                    <button
                        onClick={() => banUser.mutate({ userId: user.id, days: banDays })}
                        disabled={banUser.isPending}
                        className="mt-2 cursor-pointer rounded-[30px] bg-red-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                    >
                        {banUser.isPending ? 'Баним...' : 'Забанить'}
                    </button>
                </div>
            </Modal>

            {/* Модалка уведомления */}
            <Modal
                open={notifyOpen}
                onClose={() => setNotifyOpen(false)}
                title="Уведомить пользователя"
            >
                <div className="flex flex-col gap-3">
                    <input
                        value={notifyForm.title}
                        onChange={(e) => setNotifyForm({ ...notifyForm, title: e.target.value })}
                        placeholder="Заголовок"
                        className={inputClass}
                    />
                    <textarea
                        value={notifyForm.text}
                        onChange={(e) => setNotifyForm({ ...notifyForm, text: e.target.value })}
                        placeholder="Текст уведомления"
                        rows={3}
                        className="resize-none rounded-lg border border-[#ddd] px-3 py-2 text-sm text-[#222] outline-none focus:border-[#b552c7]"
                    />
                    <button
                        onClick={() =>
                            notifyUser.mutate({
                                userId: user.id,
                                title: notifyForm.title.trim(),
                                text: notifyForm.text.trim(),
                            })
                        }
                        disabled={!notifyForm.title.trim() || !notifyForm.text.trim() || notifyUser.isPending}
                        className="mt-2 cursor-pointer rounded-[30px] bg-gray-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-[#c4b5fd]"
                    >
                        {notifyUser.isPending ? 'Отправляем...' : 'Отправить'}
                    </button>
                </div>
            </Modal>

            {/* Модалка объектов пользователя */}
            <Modal
                open={objectsOpen}
                onClose={() => setObjectsOpen(false)}
                title="Объекты пользователя"
            >
                <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                    {userObjects?.length === 0 && (
                        <p className="py-4 text-center text-sm text-[#888]">У пользователя нет объектов</p>
                    )}
                    {userObjects?.map((o) => (
                        <div
                            key={o.apartment.id}
                            className="flex items-center justify-between gap-2 border-b border-[#eee] py-2"
                        >
                            <span className="min-w-0 truncate text-sm text-[#222]">{o.apartment.title}</span>
                            <Link
                                href={`/my-apartments/${o.apartment.id}/edit`}
                                className="shrink-0 cursor-pointer rounded-[30px] border border-[#b552c7] px-4 py-1.5 text-sm font-medium text-[#b552c7] no-underline transition-colors hover:bg-[#f6eefe]"
                            >
                                Редактировать
                            </Link>
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    );
}
