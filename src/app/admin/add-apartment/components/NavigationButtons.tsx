"use client";

// ===== ТИПЫ ПРОПСОВ =====
// ЧТО И ЗАЧЕМ ТУТ МЕНЯТЬ: Вернули твои оригинальные пропсы.
// Никаких лишних 'onSubmitForm' здесь больше нет. Всё работает через стандартный HTML-сабмит.
type NavigationButtonsProps = {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
};

export function NavigationButtons({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  isSubmitting,
  isLastStep,
}: NavigationButtonsProps) {
  return (
    <div className="step-buttons">
      {/* Кнопка "Назад" - появляется начиная со 2-го шага */}
      {currentStep > 1 && (
        <button type="button" onClick={onPrev} className="btn-secondary">
          ← Назад
        </button>
      )}

      {/* Если шаг НЕ последний, рендерится обычная кнопка перехода вперед */}
      {!isLastStep ? (
        <button
          type="button"
          onClick={onNext}
          className="btn-primary"
          // ЧТО И ЗАЧЕМ ТУТ МЕНЯТЬ: Твой родной инлайновый стиль для выравнивания кнопок
          style={{ marginLeft: currentStep > 1 ? "auto" : "0" }}
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
          className="btn-primary"
          // родной инлайновый стиль отступа для финальной кнопки
          style={{ marginLeft: currentStep > 1 ? "auto" : "0" }}
        >
          {isSubmitting ? "Сохранение..." : "➕ Добавить квартиру"}
        </button>
      )}
    </div>
  );
}
