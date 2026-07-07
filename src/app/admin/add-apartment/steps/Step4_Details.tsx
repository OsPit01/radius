"use clien";

import type { FormData } from "../page";
import { getTypeLabel, getFormLabel } from "../utils";

type Step4_DetailsProps = {
  formData: FormData;
  updateField: (field: keyof FormData, value: string | number) => void;
  error?: string | null;
};

export function Step4_Details({
  formData,
  updateField,
  error,
}: Step4_DetailsProps) {
  return (
    <fieldset className="step">
      <legend>Шаг 4: Детали объекта</legend>
      {error && (
        <div className="error" role="alert">
          {" "}
          {error}
        </div>
      )}
      <div className="form-group"></div>
    </fieldset>
  );
}
