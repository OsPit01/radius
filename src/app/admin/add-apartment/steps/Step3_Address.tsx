"use client";

import { useEffect, useState } from "react";
import type { StepProps } from "@/lib/utils";
import {
  getInputClassName,
  getFormLabel,
  INPUT_CLASS,
  sanitizeStreet,
} from "@/lib/utils";
import { getTypeLabel } from "@/lib/constants";
import { api } from "@/trpc/react";

export function Step3_Address({
  formData,
  updateField,
  error,
  errorFields,
}: StepProps) {
  const utils = api.useUtils();
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [streetOpen, setStreetOpen] = useState(false);

  useEffect(() => {
    const query = formData.street.trim();
    if (query.length < 1) {
      setStreetSuggestions([]);
      setStreetOpen(false);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const results = await utils.geo.searchStreets.fetch({
            query,
            location: formData.city,
          });
          setStreetSuggestions(results);
          setStreetOpen(results.length > 0);
        } catch {
          setStreetSuggestions([]);
          setStreetOpen(false);
        }
      })();
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.street, formData.city, utils]);

  return (
    <fieldset className="animate-[fadeIn_0.3s_ease] text-white">
      <legend className="mb-2.5 text-[17px] text-white">
        Шаг 3: Укажите адрес
      </legend>

      {error && (
        <div
          className="rounded-xl bg-[rgba(239,68,68,0.1)] p-3 text-center text-[#ef4444]"
          role="alert"
        >
          {" "}
          {error}{" "}
        </div>
      )}

      {/* Улица с автодополнением */}
      <div className="relative mt-2.5 flex flex-col gap-2">
        <label className="pt-[5px] text-sm font-semibold text-white">
          {" "}
          Улица*{" "}
        </label>
        <input
          id="street-field"
          type="text"
          value={formData.street}
          onChange={(e) => {
            updateField("street", sanitizeStreet(e.target.value));
            updateField("streetConfirmed", false);
          }}
          placeholder="Начните вводить название улицы"
          autoComplete="off"
          className={`${INPUT_CLASS} ${getInputClassName(
            formData.street,
            "street",
            errorFields,
          )}`}
        />
        {streetOpen && streetSuggestions.length > 0 && (
          <ul className="absolute top-full right-0 left-0 z-50 mt-1 max-h-[240px] overflow-y-auto rounded-xl border-2 border-[#2a1a3a] bg-[#1a0a2a] shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            {streetSuggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    updateField("street", s);
                    updateField("streetConfirmed", true);
                    setStreetOpen(false);
                  }}
                  className="block w-full cursor-pointer px-4 py-3 text-left text-sm text-white transition-colors hover:bg-[rgba(107,33,168,0.2)]"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
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

      {/* Микрорайон (необязательно) — жилой массив: Уручье, Новая Боровая */}
      <div className="mt-2.5 flex flex-col gap-2">
        <label className="pt-[5px] text-sm font-semibold text-white">
          Микрорайон
        </label>
        <input
          id="microdistrict-field"
          type="text"
          value={formData.microdistrict}
          onChange={(e) => updateField("microdistrict", e.target.value)}
          placeholder="Например: Уручье, Новая Боровая"
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
