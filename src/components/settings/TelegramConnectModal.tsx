import { CheckCircle } from '@/components/icons';
import { Modal } from '@/components/ui/Modal';

type TelegramConnectModalProps = {
    /** Видна, пока есть одноразовый код привязки. */
    open: boolean;
    onClose: () => void;
    /** Привязка уже подтверждена. */
    isSuccess: boolean;
    /** Идёт проверка привязки. */
    isPending: boolean;
    /** Ошибка подтверждения (если есть). */
    errorMessage: string | null;
    /** «Я нажал "Запустить" — проверить». */
    onConfirm: () => void;
    /** Закрыть после успеха. */
    onDone: () => void;
};

export function TelegramConnectModal({
    open,
    onClose,
    isSuccess,
    isPending,
    errorMessage,
    onConfirm,
    onDone,
}: TelegramConnectModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            {isSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <CheckCircle className="h-16 w-16 text-success" />
                    <p className="text-lg font-semibold text-foreground">Telegram подключен!</p>
                    <p className="text-sm text-muted-foreground">
                        Теперь заявки на ваши квартиры будут приходить вам в бот @radius_booking_bot
                    </p>
                    <button
                        type="button"
                        onClick={onDone}
                        className="mt-2 cursor-pointer rounded-[30px] bg-primary px-6 py-2.5 text-base font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                        Готово
                    </button>
                </div>
            ) : (
                <div className="text-center">
                    <p className="text-[17px] font-semibold text-foreground">Подключение Telegram</p>
                    <p className="mt-3 text-sm text-muted-foreground">
                        1. Мы открыли бота <span className="font-medium text-primary">@radius_booking_bot</span> в
                        Telegram
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">2. Нажмите в нём кнопку «Запустить» (Start)</p>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="mt-5 cursor-pointer rounded-[30px] bg-primary px-6 py-2.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                        {isPending ? 'Проверяем...' : 'Я нажал «Запустить» — проверить'}
                    </button>
                    {errorMessage && <p className="mx-auto mt-3 max-w-xs text-sm text-destructive">{errorMessage}</p>}
                </div>
            )}
        </Modal>
    );
}
