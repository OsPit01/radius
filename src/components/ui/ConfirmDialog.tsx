import { Modal } from '@/components/ui/Modal';

// ============================================================
// ConfirmDialog — единая модалка подтверждения удаления.
//
// Один компонент на ВСЕ места «точно удалить?»: чат, поддержка,
// беседы, блоки, уведомления. Одинаковый вид и поведение везде.
//
// Пропсы:
//   open       — показана ли модалка
//   onClose    — «Отмена» (закрыть)
//   onConfirm  — «Удалить» (действие)
//   title      — заголовок (по умолчанию «Удалить?»)
//   text       — пояснение
//   isPending  — идёт ли удаление (кнопка «Удаление...», блокировка)
// ============================================================
type ConfirmDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    text: string;
    isPending?: boolean;
};

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Удалить?',
    text,
    isPending = false,
}: ConfirmDialogProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
        >
            <p className="text-base leading-relaxed text-foreground">{text}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isPending}
                    className="min-h-11 cursor-pointer rounded-[30px] bg-destructive px-8 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? 'Удаление...' : 'Удалить'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="min-h-11 cursor-pointer rounded-[30px] border border-border px-8 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Отмена
                </button>
            </div>
        </Modal>
    );
}
