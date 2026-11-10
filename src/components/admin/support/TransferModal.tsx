import { Modal } from '@/components/ui/Modal';
import type { RouterOutputs } from '@/trpc/react';

type TransferModalProps = {
    open: boolean;
    onClose: () => void;
    admins: RouterOutputs['support']['admins'] | undefined;
    myId: string;
    transferTo: string;
    onChangeTransferTo: (id: string) => void;
    onTransfer: () => void;
    isPending: boolean;
};

export function TransferModal({
    open,
    onClose,
    admins,
    myId,
    transferTo,
    onChangeTransferTo,
    onTransfer,
    isPending,
}: TransferModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Передать обращение"
        >
            <div className="flex flex-col gap-3">
                <select
                    value={transferTo}
                    onChange={(e) => onChangeTransferTo(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                    <option value="">Выберите админа...</option>
                    {admins
                        ?.filter((a) => a.id !== myId)
                        .map((a) => (
                            <option
                                key={a.id}
                                value={a.id}
                            >
                                {a.name ?? a.email}
                            </option>
                        ))}
                </select>
                <button
                    type="button"
                    onClick={onTransfer}
                    disabled={!transferTo || isPending}
                    className="mt-2 cursor-pointer rounded-[30px] bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPending ? 'Передаём...' : 'Передать'}
                </button>
            </div>
        </Modal>
    );
}
