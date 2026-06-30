"use client";

import type { FormData } from "../page";
import { getTypeLabel } from "../utils";
type Step3_AddressProps = {
  formData: FormData;
  updateField: (field: keyof FormData, value: string | number) => void;
  setFormData?: React.Dispatch<React.SetStateAction<FormData>>;
};

export function Step3_Address({
  formData,
  updateField,
  setFormData,
}: Step3_AddressProps) {
  return (
    <div className="step">
      <h2>Шаг 3: Укажите адрес</h2>
      <div className="form-group">
        <label> Улица * </label>
        <input type="text"></input>
      </div>
      <div className="form-group">
        <label>Номер дома</label>
        <input />
      </div>
      <div className="summary-panel">
        <p> {getTypeLabel(formData.type)}</p>
        <p> {getTypeLabel(formData.city)}</p>
      </div>
    </div>
  );
}
