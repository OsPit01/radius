"use client";
import type { StepProps } from "@/lib/utils";
import { getInputClassName, INPUT_CLASS } from "@/lib/utils";
import { getTypeLabel } from "@/lib/constants";

export function Step2_City({
  formData,
  updateField,
  error,
  errorFields,
}: StepProps) {
  return (
    <fieldset className="animate-[fadeIn_0.3s_ease] text-white">
      <legend className="mb-2.5 text-[17px] text-white">
        Шаг 2: выберите город
      </legend>
      <div className="mt-2.5 flex flex-col gap-2">
        <label htmlFor="city-field" className="pt-[5px] text-sm font-semibold text-white">
          {" "}
          Город{" "}
        </label>

        {/* ===== ПОЛЕ ВВОДА ===== */}
        <input
          id="city-field"
          type="text"
          value={formData.city}
          onChange={(e) => updateField("city", e.target.value)}
          placeholder="Например: Минск, Москва"
          className={`${INPUT_CLASS} ${getInputClassName(
            formData.city,
            "city",
            errorFields,
            "city-input",
          )}`}
          aria-required="true"
        />
        {error && <div className="mt-1 text-[13px] text-[#ee7272]"> {error} </div>}
      </div>
      <div className="mt-5 p-[5px] text-[13px] text-[rgba(216,214,214,0.911)]">
        {getTypeLabel(formData.type)}
      </div>
    </fieldset>
  );
}
