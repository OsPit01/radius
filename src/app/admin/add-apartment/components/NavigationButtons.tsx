"use client";

// ===== ТИПЫ ПРОПСОВ =====
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
      {currentStep > 1 && (
        <button type="button" onClick={onPrev} className="btn-secondary">
          ← Назад
        </button>
      )}

      {!isLastStep ? (
        <button
          type="button"
          onClick={onNext}
          className="btn-primary"
          style={{ marginLeft: currentStep > 1 ? "auto" : "0" }}
        >
          Далее →
        </button>
      ) : (
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
          style={{ marginLeft: currentStep > 1 ? "auto" : "0" }}
        >
          {isSubmitting ? "Сохранение..." : "➕ Добавить квартиру"}
        </button>
      )}
    </div>
  );
}
