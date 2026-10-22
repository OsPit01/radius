import { ArrowLeft, ArrowRight, Plus } from '@/components/icons';

// ===== ТИПЫ ПРОПСОВ =====
// ЧТО И ЗАЧЕМ ТУТ МЕНЯТЬ: Вернули твои оригинальные пропсы.
// Никаких лишних 'onSubmitForm' здесь больше нет. Всё работает через стандартный HTML-сабмит.
type NavigationButtonsProps = {
    currentStep: number;
    onNext: () => void;
    onPrev: () => void;
    isSubmitting: boolean;
    isLastStep: boolean;
};

export function NavigationButtons({ currentStep, onNext, onPrev, isSubmitting, isLastStep }: NavigationButtonsProps) {
    const btnPrimary = `flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[30px] bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground max-[640px]:w-full max-[640px]:text-center`;

    return (
        <div className="mt-[30px] flex justify-between gap-4 max-[640px]:flex-col">
            {/* Кнопка "Назад" - появляется начиная со 2-го шага */}
            {currentStep > 1 && (
                <button
                    type="button"
                    onClick={onPrev}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[30px] border border-border bg-card px-8 py-3 text-base font-semibold text-foreground transition-all duration-200 hover:bg-muted max-[640px]:w-full max-[640px]:text-center"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Назад
                </button>
            )}

            {/* Если шаг НЕ последний, рендерится обычная кнопка перехода вперед */}
            {!isLastStep ? (
                <button
                    type="button"
                    onClick={onNext}
                    className={`${btnPrimary} ${currentStep > 1 ? 'ml-auto' : ''}`}
                >
                    Далее
                    <ArrowRight className="h-5 w-5" />
                </button>
            ) : (
                // Если шаг ПОСЛЕДНИЙ (5-й), рендерится кнопка отправки формы на сервер
                <button
                    type="button"
                    onClick={onNext}
                    disabled={isSubmitting}
                    className={`${btnPrimary} ${currentStep > 1 ? 'ml-auto' : ''}`}
                >
                    {isSubmitting ? (
                        'Сохранение...'
                    ) : (
                        <>
                            <Plus className="h-5 w-5" />
                            Добавить квартиру
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
