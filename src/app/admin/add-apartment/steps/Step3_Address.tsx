"use client";

import type { StepProps } from "@/lib/utils";
import { getInputClassName, getFormLabel, INPUT_CLASS } from "@/lib/utils";
import { getTypeLabel } from "@/lib/constants";

export function Step3_Address({
  formData,
  updateField,
  error,
  errorFields,
}: StepProps) {
  return (
    <fieldset className="animate-[fadeIn_0.3s_ease] text-white">
      <legend className="mb-2.5 text-[17px] text-white">
        Шаг 3: Укажите адрес
      </legend>
      {/* Если валидация не прошла, выводим семантическое уведомление об ошибке */}
      {error && (
        <div
          className="rounded-xl bg-[rgba(239,68,68,0.1)] p-3 text-center text-[#ef4444]"
          role="alert"
        >
          {" "}
          {error}{" "}
        </div>
      )}

      {/* Поле района */}
      <div className="mt-2.5 flex flex-col gap-2">
        <label className="pt-[5px] text-sm font-semibold text-white">
          {" "}
          Район{" "}
        </label>
        <input
          id="district-field"
          type="text"
          value={formData.district}
          onChange={(e) => updateField("district", e.target.value)}
          placeholder="Например: Центральный"
          className={`${INPUT_CLASS} ${getInputClassName(
            formData.district,
            "district",
            errorFields,
          )}`}
        />
      </div>
      {/* Поле Улицы */}
      <div className="mt-2.5 flex flex-col gap-2">
        <label className="pt-[5px] text-sm font-semibold text-white">
          {" "}
          Улица*{" "}
        </label>
        <input
          id="street-field"
          type="text"
          value={formData.street}
          onChange={(e) => updateField("street", e.target.value)}
          placeholder="улица"
          className={`${INPUT_CLASS} ${getInputClassName(
            formData.street,
            "street",
            errorFields,
          )}`}
        />
      </div>
      {/* Поле номер дома */}
      <div className="mt-2.5 flex flex-col gap-2">
        <label className="pt-[5px] text-sm font-semibold text-white">
          {" "}
          Номер дома*
        </label>
        <input
          id="numberHome-field"
          type="text"
          value={formData.numberHome}
          onChange={(e) => updateField("numberHome", e.target.value)}
          placeholder="Номер дома"
          className={`${INPUT_CLASS} ${getInputClassName(
            formData.numberHome,
            "numberHome",
            errorFields,
          )}`}
        />
      </div>

      {/* Поле корпуса */}
      <div className="mt-2.5 flex flex-col gap-2">
        <label className="pt-[5px] text-sm font-semibold text-white">
          Корпус
        </label>
        <input
          id="building-field"
          type="text"
          value={formData.building}
          onChange={(e) => updateField("building", e.target.value)}
          placeholder="Корпус"
          className={INPUT_CLASS}
        />
      </div>

      <div className="mt-5 p-[5px] text-[13px] text-[rgba(216,214,214,0.911)]">
        <p> {getTypeLabel(formData.type)}</p>
        <p> {getFormLabel(formData, "city")}</p>
      </div>
    </fieldset>
  );
}
