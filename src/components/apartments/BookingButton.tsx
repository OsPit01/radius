// Кнопка «Забронировать» + модалка с формой.
//
// Компонент ТОНКИЙ: вся логика формы — в хуке useBookingForm,
// вёрстка формы — в BookingForm. Здесь только кнопка, модалка
// и экран «Заявка отправлена!».

import Link from 'next/link';

import { CheckCircle } from '@/components/icons';
import { Modal } from '@/components/ui/Modal';
import { useBookingForm, type UseBookingFormArgs } from '@/hooks/useBookingForm';

import { BookingForm } from './BookingForm';

export function BookingButton(args: UseBookingFormArgs) {
    const form = useBookingForm(args);

    return (
        <>
            {form.session ? (
                <button
                    type="button"
                    onClick={form.openForm}
                    className="mt-3 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Забронировать
                </button>
            ) : (
                <Link
                    href="/auth/signin"
                    className="mt-3 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Забронировать
                </Link>
            )}
            <Modal
                open={form.open}
                // Любой способ закрытия (крестик, клик по фону, Esc) сбрасывает
                // состояние мутации — форма снова будет доступна при следующем открытии.
                onClose={form.handleClose}
                title="Бронирование"
            >
                {form.isSuccess ? (
                    // role="status": скринридер объявляет результат отправки,
                    // а не только зримый текст (рекомендация гайда forms).
                    <div
                        role="status"
                        className="flex flex-col items-center gap-3 py-6 text-center"
                    >
                        <CheckCircle className="h-16 w-16 text-success" />
                        <p className="text-lg font-semibold text-foreground">Заявка отправлена!</p>
                        <p className="text-sm text-muted-foreground">
                            Заявка сохранена: владелец увидит её в личном кабинете и свяжется с вами. Если у него
                            подключён Telegram, уведомление придёт и туда.
                        </p>
                        <button
                            type="button"
                            onClick={form.handleClose}
                            className="mt-2 rounded-xl border border-primary px-6 py-2 text-sm font-medium text-primary hover:bg-muted"
                        >
                            Хорошо
                        </button>
                    </div>
                ) : (
                    <BookingForm form={form} />
                )}
            </Modal>
        </>
    );
}
