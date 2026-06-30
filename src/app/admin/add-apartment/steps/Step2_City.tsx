import type { FormData } from "../page";
import { getTypeLabel } from "../utils";

type Step2_CityProps = {
  formData: FormData;
  updateField: (field: keyof FormData, value: string | number) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  error?: string | null;
};

export function Step2_City({
  formData,
  updateField,
  setFormData,
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
    <div className="step">
      <div className="step-title">Шаг 2: выберите город</div>
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
    </div>
  );
}
