"use client";

import type { FormData } from "../page";
import { getFormLabel, getTypeLabel } from "../utils";

type Step3_AddressProps = {
  formData: FormData;
  updateField: (field: keyof FormData, value: string | number) => void;

  error?: string | null;
};

export function Step3_Address({
  formData,
  updateField,

  error,
}: Step3_AddressProps) {
  return (
    <fieldset className="step">
      <legend className="step-title">Шаг 3: Укажите адрес</legend>
      {/* Если валидация не прошла, выводим семантическое уведомление об ошибке */}
      {error && <div className="error-message"> {error} </div>}

      {/* Поле Района */}
      <div className="form-group">
        <label> Район </label>
        <input
          id="district-field"
          type="text"
          value={formData.district}
          onChange={(e) => updateField("district", e.target.value)}
          placeholder="район"
        />
      </div>
      <div className="form-group">
        <label> Улица* </label>
        <input
          id="street-field"
          type="text"
          value={formData.street}
          onChange={(e) => updateField("street", e.target.value)}
          placeholder="улица"
        />
      </div>
      <div className="form-group">
        <label>Номер дома*</label>
        <input
          id="building-field"
          type="text"
          value={formData.building}
          onChange={(e) => updateField("building", e.target.value)}
          placeholder="дом"
        />
      </div>

      <div className="form-group">
        <label> корпус</label>
        <input
          id="numberHome-field"
          type="text"
          value={formData.numberHome}
          onChange={(e) => updateField("numberHome", e.target.value)}
          placeholder="корпус (необязательно)"
        />
      </div>
      <div className="summary-panel">
        <p> {getTypeLabel(formData.type)}</p>
        <p> {getFormLabel(formData, "city")}</p>
      </div>
    </fieldset>
  );
}
