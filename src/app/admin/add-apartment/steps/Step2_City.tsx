import type { FormData } from "../page";
import {
  getTypeLabel,
  getInputClassName,
  formatApartmentData,
  validateStep,
} from "@/lib/utils";

type Step2_CityProps = {
  formData: FormData;
  updateField: (field: keyof FormData, value: string | number) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  error?: string | null;
  errorFields: (keyof FormData)[];
};

export function Step2_City({
  formData,
  updateField,
  error,
  errorFields,
}: Step2_CityProps) {
  const hasText = formData.city.length > 0;
  const isInvalid = errorFields.includes("city");

  return (
    <fieldset className="step">
      <legend className="step-title">Шаг 2: выберите город</legend>
      <div className="form-group">
        <label htmlFor="city-field"> Город </label>

        {/* ===== ПОЛЕ ВВОДА ===== */}
        <input
          id="city-field"
          type="text"
          value={formData.city}
          onChange={(e) => updateField("city", e.target.value)}
          placeholder="Например: Минск, Москва"
          className={getInputClassName(
            formData.city,
            "city",
            errorFields,
            "city-input",
          )}
          aria-required="true"
        />
        {error && <div className="error-text"> {error} </div>}
      </div>
      <div className="summary-panel">{getTypeLabel(formData.type)}</div>
    </fieldset>
  );
}
