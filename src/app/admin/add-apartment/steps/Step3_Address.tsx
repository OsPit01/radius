"use client";

import type { FormData } from "../page";
import { getFormLabel, getInputClassName, getTypeLabel } from "../utils";

type Step3_AddressProps = {
  formData: FormData;
  updateField: (field: keyof FormData, value: string | number) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  error?: string | null;
  errorFields: (keyof FormData)[];
};

export function Step3_Address({
  formData,
  updateField,
  error,
  errorFields,
}: Step3_AddressProps) {
  return (
    <fieldset className="step">
      <legend className="step-title">Шаг 3: Укажите адрес</legend>
      {/* Если валидация не прошла, выводим семантическое уведомление об ошибке */}
      {error && (
        <div className="error-message" role="alert">
          {" "}
          {error}{" "}
        </div>
      )}

      {/* Поле района */}
      <div className="form-group">
        <label> Район </label>
        <input
          id="district-field"
          type="text"
          value={formData.district}
          onChange={(e) => updateField("district", e.target.value)}
          placeholder="Например: Центральный"
          className={getInputClassName(
            formData.district,
            "district",
            errorFields,
          )}
        />
      </div>
      {/* Поле Улицы */}
      <div className="form-group">
        <label> Улица* </label>
        <input
          id="street-field"
          type="text"
          value={formData.street}
          onChange={(e) => updateField("street", e.target.value)}
          placeholder="улица"
          className={getInputClassName(formData.street, "street", errorFields)}
        />
      </div>
      {/* Поле номер дома */}
      <div className="form-group">
        <label> Номер дома*</label>
        <input
          id="numberHome-field"
          type="text"
          value={formData.numberHome}
          onChange={(e) => updateField("numberHome", e.target.value)}
          placeholder="Номер дома"
          className={getInputClassName(
            formData.numberHome,
            "numberHome",
            errorFields,
          )}
        />
      </div>

      {/* Поле корпуса */}
      <div className="form-group">
        <label>Корпус</label>
        <input
          id="building-field"
          type="text"
          value={formData.building}
          onChange={(e) => updateField("building", e.target.value)}
          placeholder="Корпус"
        />
      </div>

      <div className="summary-panel">
        <p> {getTypeLabel(formData.type)}</p>
        <p> {getFormLabel(formData, "city")}</p>
      </div>
    </fieldset>
  );
}
