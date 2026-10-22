import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { Close } from '@/components/icons';

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (!open) {
            return;
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[20px] bg-card p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground">{title}</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label="Закрыть"
                        >
                            <Close className="h-7 w-7" />
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
