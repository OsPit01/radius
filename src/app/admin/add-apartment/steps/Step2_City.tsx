import type { FormData } from "../page";
import { getTypeLabel } from "../utils";

type Step2_CityProps = {
  formData: FormData;
  updateField: (field: keyof FormData, value: string | number) => void;

  error?: string | null;
};

export function Step2_City({
  formData,
  updateField,

  error,
}: Step2_CityProps) {
  // ===== ФУНКЦИЯ ДЛЯ ОБРАБОТКИ ИЗМЕНЕНИЯ =====
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Всегда обновляем значение города в стейте
    const value = e.target.value;
    // Обновляем значение города
    updateField("city", value);

    // ===== ПРОВЕРКА НА НАЛИЧИЕ ОШИБКИ ДЛЯ ПОДСВЕТКИ =====
  };

  const hasText = formData.city.trim().length < 2;
  const isValid = hasText && formData.city.trim().length >= 2;
  return (
    <fieldset className="step">
      <legend className="step-title">Шаг 2: выберите город</legend>
      <div className="form-group">
        <label> Город </label>

        {/* ===== ПОЛЕ ВВОДА ===== */}
        <input
          type="text"
          value={formData.city}
          onChange={handleCityChange}
          placeholder="Например: Минск, Москва"
          className={`city-input ${hasText ? "has-text" : ""} ${isValid ? "valid" : ""} ${error && !isValid ? "error" : ""}`}
        />
        {error && <div className="error-text"> {error} </div>}
      </div>
      <div className="summary-panel">{getTypeLabel(formData.type)}</div>
    </fieldset>
  );
}
