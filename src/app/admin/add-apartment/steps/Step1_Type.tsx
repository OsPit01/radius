"use client";
import type { FormData } from "../page";
import { getTypeLabel } from "../utils";
type Step1_TypeProps = {
  formData: FormData;
  updateField: (field: keyof FormData, value: string | number) => void;
};

export function Step1_Type({ formData, updateField }: Step1_TypeProps) {
  return (
    <fieldset className="step">
      <legend className="step-title"> Шаг: 1 что вы хотите добавить?</legend>
      <div className="type-selector">
        <div
          className={`type-option ${formData.type === "apartment" ? "active" : ""}`}
          onClick={() =>
            updateField(
              "type",
              formData.type === "apartment" ? "" : "apartment",
            )
          }
        >
          <p> квартира,</p> <p> партаменты</p>
        </div>
        {/* Позже можно добавить: Коттедж, Отель, Гостевой дом */}
      </div>
      <p className="step-hint">
        {" "}
        Выберите тип обьекта (пока доступна только квартира)
      </p>
      <p className="summary-panel"> {getTypeLabel(formData.type)}</p>
    </fieldset>
  );
}
