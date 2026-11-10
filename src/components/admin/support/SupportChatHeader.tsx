import { useState } from 'react';

import { ArrowLeft } from '@/components/icons';
import { getRoleInfo } from '@/lib/constants/roles';
import { getRoleColor } from '@/lib/theme';

import type { SupportTicket } from './TicketCard';

type SupportChatHeaderProps = {
    selectedId: number;
    selected: SupportTicket | null;
    myId: string;
    /** Заявка закрыта: часть кнопок действий не нужна. */
    isClosed: boolean;
    /** Действовать может: не закрыта И не ведёт другой админ. */
    canAct: boolean;
    /** Может ли удалять обращения: только superadmin/mainadmin. */
    canDelete: boolean;
    onBack: () => void;
    onTake: () => void;
    onLeave: () => void;
    onClose: () => void;
    onOpenTransfer: () => void;
    onDelete: () => void;
};

/**
 * Шапка окна заявки: назад + номер заявки + кто ведёт + кнопки действий
 * (Участвовать / Выйти / Закрыть / Передать / Удалить).
 */
export function SupportChatHeader({
    selectedId,
    selected,
    myId,
    isClosed,
    canAct,
    canDelete,
    onBack,
    onTake,
    onLeave,
    onClose,
    onOpenTransfer,
    onDelete,
}: SupportChatHeaderProps) {
    // Двухшаговое удаление: первый клик «Удалить» → кнопка превращается
    // в «Точно удалить?», второй клик — реальное удаление. Защита от
    // случайного клика: заявку со всей перепиской не вернуть.
    // Состояние локальное: шапка размонтируется при возврате к списку,
    // и подтверждение сбрасывается само.
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <div className="flex flex-wrap items-center gap-3 border-b pb-4">
            <button
                type="button"
                className="flex h-11 cursor-pointer items-center rounded-lg px-3 text-sm hover:bg-muted"
                onClick={onBack}
            >
                <ArrowLeft className="h-6 w-6" />
            </button>

            {/* Номер заявки: маленький жирный, прижат к левому краю. */}
            <span className="text-sm font-bold">Заявка #{selectedId}</span>

            {/* Закрытую заявку помечаем бейджем — сразу видно, что она решена. */}
            {isClosed && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    Закрыта
                </span>
            )}

            {/* Ведёт: имя + бейдж роли. */}
            {selected?.assignedAdmin ? (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    Ведёт:
                    <span className="font-medium text-foreground">
                        {selected.assignedAdmin.firstName ?? selected.assignedAdmin.name ?? 'Админ'}
                    </span>
                    <span
                        style={{ background: getRoleColor(selected.assignedAdmin.role) }}
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase"
                    >
                        {getRoleInfo(selected.assignedAdmin.role).label}
                    </span>
                </span>
            ) : (
                // Закрытую заявку в работу уже не взять — кнопка не нужна.
                !isClosed && (
                    <button
                        type="button"
                        onClick={onTake}
                        className="h-11 cursor-pointer rounded-[30px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Участвовать
                    </button>
                )
            )}

            {/* «Выйти» видит только тот, кто ведёт эту заявку (и она открыта). */}
            {!isClosed && selected?.assignedAdmin?.id === myId && (
                <button
                    type="button"
                    onClick={onLeave}
                    className="h-11 cursor-pointer rounded-[30px] border border-border px-4 text-sm font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
                >
                    Выйти
                </button>
            )}

            {/* «Закрыть» — финальное действие: решает заявку. Доступно тому,
                кто может действовать (ведёт её или никто не ведёт). */}
            {canAct && (
                <button
                    type="button"
                    onClick={onClose}
                    className="h-11 cursor-pointer rounded-[30px] border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                    Закрыть
                </button>
            )}

            {/* Закрытую заявку передавать бессмысленно — кнопку прячем. */}
            {!isClosed && (
                <button
                    type="button"
                    onClick={onOpenTransfer}
                    className="h-11 cursor-pointer rounded-[30px] border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                    Передать
                </button>
            )}

            {/* Удаление — только superadmin/mainadmin. Двухшаговое:
                первый клик включает подтверждение, второй удаляет
                заявку со ВСЕЙ перепиской (безвозвратно). */}
            {canDelete &&
                (confirmDelete ? (
                    <button
                        type="button"
                        onClick={() => {
                            onDelete();
                            setConfirmDelete(false);
                        }}
                        className="h-11 cursor-pointer rounded-[30px] bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
                    >
                        Точно удалить?
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="h-11 cursor-pointer rounded-[30px] border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                    >
                        Удалить
                    </button>
                ))}
        </div>
    );
}
