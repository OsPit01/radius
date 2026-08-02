"use client";

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

export function NavigationButtons({
  currentStep,
  onNext,
  onPrev,
  isSubmitting,
  isLastStep,
}: NavigationButtonsProps) {
  const btnPrimary = `flex-1 cursor-pointer rounded-[30px] bg-[#b552c7] px-8 py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-[#9a3fb0] disabled:cursor-not-allowed disabled:bg-[#3a2a4a] disabled:text-[#666] max-[640px]:w-full max-[640px]:text-center`;

  return (
    <div className="mt-[30px] flex justify-between gap-4 max-[640px]:flex-col">
      {/* Кнопка "Назад" - появляется начиная со 2-го шага */}
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 cursor-pointer rounded-[30px] border border-[#dddddd] bg-white px-8 py-3 text-base font-semibold text-black transition-all duration-200 hover:bg-[#ebd8d8] max-[640px]:w-full max-[640px]:text-center"
        >
          ← Назад
        </button>
      )}

      {/* Если шаг НЕ последний, рендерится обычная кнопка перехода вперед */}
      {!isLastStep ? (
        <button
          type="button"
          onClick={onNext}
          className={`${btnPrimary} ${currentStep > 1 ? "ml-auto" : ""}`}
        >
          Далее →
        </button>
      ) : (
        // Если шаг ПОСЛЕДНИЙ (5-й), рендерится кнопка отправки формы на сервер
        <button
          type="button"
          onClick={() => {
            console.log("🔴 КНОПКА НАЖАТА! onNext:", onNext);
            onNext();
          }} //ВЫЗЫВАЕТ goToNextStep, КОТОРЫЙ ВЫЗЫВАЕТ handleSubmit
          disabled={isSubmitting}
          className={`${btnPrimary} ${currentStep > 1 ? "ml-auto" : ""}`}
        >
          {isSubmitting ? "Сохранение..." : "➕ Добавить квартиру"}
        </button>
      )}
    </div>
  );
}
