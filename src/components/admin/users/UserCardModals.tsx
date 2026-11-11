import Link from 'next/link';

import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Modal } from '@/components/ui/Modal';
import type { RouterOutputs } from '@/trpc/react';

// Общий стиль инпутов модалок — один источник правды внутри этого файла.
const inputClass =
    'w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-primary';

/** Поля формы редактирования пользователя (состояние живёт у родителя). */
export type EditUserForm = {
    firstName: string;
    lastName: string;
    patronymic: string;
    email: string;
    phone: string;
};

/** Поля формы уведомления (состояние живёт у родителя). */
export type NotifyForm = {
    title: string;
    text: string;
};

type EditUserModalProps = {
    open: boolean;
    onClose: () => void;
    form: EditUserForm;
    /** Обновить ОДНО поле формы (поле указано именем, значение приходит из input). */
    onFieldChange: (field: keyof EditUserForm, value: string) => void;
    onSave: () => void;
    isSaving: boolean;
};

/** Модалка «Редактировать пользователя». Состояние и мутация — у родителя. */
export function EditUserModal({ open, onClose, form, onFieldChange, onSave, isSaving }: EditUserModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Редактировать пользователя"
        >
            <div className="flex flex-col gap-3">
                <input
                    value={form.firstName}
                    onChange={(e) => onFieldChange('firstName', e.target.value)}
                    placeholder="Имя"
                    className={inputClass}
                />
                <input
                    value={form.lastName}
                    onChange={(e) => onFieldChange('lastName', e.target.value)}
                    placeholder="Фамилия"
                    className={inputClass}
                />
                <input
                    value={form.patronymic}
                    onChange={(e) => onFieldChange('patronymic', e.target.value)}
                    placeholder="Отчество"
                    className={inputClass}
                />
                <input
                    type="email"
                    value={form.email}
                    onChange={(e) => onFieldChange('email', e.target.value)}
                    placeholder="Email"
                    className={inputClass}
                />
                <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => onFieldChange('phone', e.target.value)}
                    placeholder="Телефон"
                    className={inputClass}
                />
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="mt-2 cursor-pointer rounded-[30px] bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
                >
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>
        </Modal>
    );
}

type BanUserModalProps = {
    open: boolean;
    onClose: () => void;
    userName: string;
    days: number;
    /** Пришло НОВОЕ число дней (уже ограниченное 1–3650). */
    onDaysChange: (days: number) => void;
    onBan: () => void;
    isPending: boolean;
};

/** Модалка «Забанить пользователя». */
export function BanUserModal({ open, onClose, userName, days, onDaysChange, onBan, isPending }: BanUserModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Забанить пользователя"
        >
            <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{userName}</p>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    На сколько дней?
                    <input
                        type="number"
                        min={1}
                        max={3650}
                        value={days}
                        // Ограничиваем сразу при вводе: 1–3650 дней (10 лет).
                        onChange={(e) => onDaysChange(Math.max(1, Math.min(3650, Number(e.target.value))))}
                        className={inputClass}
                    />
                </label>
                <button
                    onClick={onBan}
                    disabled={isPending}
                    className="mt-2 cursor-pointer rounded-[30px] bg-destructive px-6 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
                >
                    {isPending ? 'Баним...' : 'Забанить'}
                </button>
            </div>
        </Modal>
    );
}

type NotifyUserModalProps = {
    open: boolean;
    onClose: () => void;
    form: NotifyForm;
    onFieldChange: (field: keyof NotifyForm, value: string) => void;
    onSend: () => void;
    isSending: boolean;
};

/** Модалка «Уведомить пользователя». */
export function NotifyUserModal({ open, onClose, form, onFieldChange, onSend, isSending }: NotifyUserModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Уведомить пользователя"
        >
            <div className="flex flex-col gap-3">
                <input
                    value={form.title}
                    onChange={(e) => onFieldChange('title', e.target.value)}
                    placeholder="Заголовок"
                    className={inputClass}
                />
                <textarea
                    value={form.text}
                    onChange={(e) => onFieldChange('text', e.target.value)}
                    placeholder="Текст уведомления"
                    rows={3}
                    className="resize-none rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                <button
                    onClick={onSend}
                    disabled={!form.title.trim() || !form.text.trim() || isSending}
                    className="mt-2 cursor-pointer rounded-[30px] bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
                    {isSending ? 'Отправляем...' : 'Отправить'}
                </button>
            </div>
        </Modal>
    );
}

type UserObjectsModalProps = {
    open: boolean;
    onClose: () => void;
    /** Объекты пользователя (подгружаются только когда модалка открыта). */
    objects: RouterOutputs['apartment']['getByUser'] | undefined;
};

/** Модалка «Объекты пользователя»: список с фото и ссылкой на редактирование. */
export function UserObjectsModal({ open, onClose, objects }: UserObjectsModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Объекты пользователя"
        >
            <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                {objects?.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">У пользователя нет объектов</p>
                )}
                {objects?.map((o) => (
                    <div
                        key={o.apartment.id}
                        className="flex items-center justify-between gap-2 border-b border-border py-2"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <ImageWithFallback
                                src={o.apartment.images?.[0]}
                                alt=""
                                width={48}
                                height={48}
                                className="size-12 shrink-0 rounded-md object-cover"
                            />
                            <span className="text-sm text-muted-foreground">#{o.apartment.id}</span>
                        </div>
                        <Link
                            href={`/my-apartments/${o.apartment.id}/edit`}
                            className="shrink-0 cursor-pointer rounded-[30px] border border-primary px-4 py-1.5 text-sm font-medium text-primary no-underline transition-colors hover:bg-muted"
                        >
                            Редактировать
                        </Link>
                    </div>
                ))}
            </div>
        </Modal>
    );
}
