"use client";
import type { StepProps } from "@/lib/utils";
import { getTypeLabel } from "@/lib/constants";

export function Step1_Type({ formData, updateField }: StepProps) {
  return (
    <fieldset className="animate-[fadeIn_0.3s_ease] text-white">
      <legend className="mb-2.5 text-[17px] text-white">
        {" "}
        Шаг: 1 что вы хотите добавить?
      </legend>
      <div className="flex flex-wrap gap-4">
        <div
          className={`cursor-pointer select-none rounded-xl border-[3px] border-[#dadada] px-6 py-4 text-base text-[#dadada] transition-all duration-200 hover:border-[#b552c7] hover:text-white ${
            formData.type === "apartment"
              ? "border-[#b552c7] bg-[rgba(181,82,199,0.1)] text-white"
              : ""
          }`}
          onClick={() =>
            updateField(
              "type",
              formData.type === "apartment" ? "" : "apartment",
            )
          }
        >
          <p> квартира,</p> <p> апартаменты</p>
        </div>
        {/* Позже можно добавить: Коттедж, Отель, Гостевой дом */}
      </div>
      <p className="mt-3 text-sm text-[#888]">
        {" "}
        Выберите тип обьекта (пока доступна только квартира)
      </p>
      <p className="mt-5 p-[5px] text-[13px] text-[rgba(216,214,214,0.911)]">
        {" "}
        {getTypeLabel(formData.type)}
      </p>
    </fieldset>
  );
}
