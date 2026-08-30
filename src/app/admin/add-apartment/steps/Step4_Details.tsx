"use client";

import { CustomSelect } from "../components/CustomSelect";
import type { FormData, StepProps } from "@/lib/utils";
import { INPUT_CLASS, toggleAmenity } from "@/lib/utils";
import { AMENITIES, PARKING_TYPES, CURRENCIES, getTypeLabel } from "@/lib/constants";

export function Step4_Details({
  formData,
  updateField,
  error,
  errorFields,
}: StepProps) {
  // ===== ФУНКЦИЯ ДЛЯ ПРОВЕРКИ ОШИБОК =====
  const hasError = (field: keyof FormData) => errorFields.includes(field);

  // ===== ФУНКЦИЯ ДЛЯ ЧЕКБОКСОВ УДОБСТВ =====
  const handleAmenityToggle = (amenityId: string, checked: boolean) => {
    updateField(
      "amenities",
      toggleAmenity(formData.amenities || [], amenityId, checked),
    );
  };

  // ===== ФУНКЦИЯ ДЛЯ РАДИО КНОПОК ПАРКОВКИ =====
  const handleParkingChange = (value: string) => {
    updateField("parking", value);
  };

  return (
    <fieldset className="animate-[fadeIn_0.3s_ease] text-white">
      <legend className="mb-2.5 text-[17px] text-white">
        Шаг 4: Детали объекта
      </legend>

      {error && (
        <div
          className="rounded-xl bg-[rgba(239,68,68,0.1)] p-3 text-center text-[#ef4444]"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ===== 1. ЗАГОЛОВОК ===== */}
      <div className="mt-2.5 flex flex-col gap-2">
        <label
          htmlFor="title-field"
          className="pt-[5px] text-sm font-semibold text-white"
        >
          Напишите заголовок <span className="required">*</span>
        </label>
        <input
          id="title-field"
          type="text"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          className={`${INPUT_CLASS} ${hasError("title") ? "!border-[#ef4444]" : ""}`}
          placeholder="Например: Уютная студия в центре города"
        />
      </div>

      {/* ===== 2. ЦЕНА + ВАЛЮТА ===== */}
      <div className="grid grid-cols-2 gap-5 text-white max-[640px]:grid-cols-1">
        <div className="mt-2.5 flex flex-col gap-2">
          <label
            htmlFor="price-field"
            className="pt-[5px] text-sm font-semibold text-white"
          >
            Цена за сутки <span className="required">*</span>
          </label>
          <input
            id="price-field"
            type="number"
            value={formData.price || ""}
            onChange={(e) => updateField("price", Number(e.target.value))}
            className={`${INPUT_CLASS} ${hasError("price") ? "!border-[#ef4444]" : ""}`}
            placeholder="100"
            min="30"
          />
        </div>

        <div className="mt-2.5 flex flex-col gap-2">
          <label
            htmlFor="currency-field"
            className="pt-[5px] text-sm font-semibold text-white"
          >
            Валюта
          </label>
          <CustomSelect
            options={CURRENCIES}
            value={formData.currency ?? "BYN"}
            onChange={(value) => updateField("currency", value)}
          />
        </div>
      </div>

      {/* ===== 3. КОМНАТЫ + ВМЕСТИМОСТЬ ===== */}
      <div className="grid grid-cols-2 gap-5 text-white max-[640px]:grid-cols-1">
        <div className="mt-2.5 flex flex-col gap-2">
          <label
            htmlFor="rooms-field"
            className="pt-[5px] text-sm font-semibold text-white"
          >
            Количество комнат <span className="required">*</span>
          </label>
          <input
            id="rooms-field"
            type="number"
            value={formData.rooms || ""}
            onChange={(e) => updateField("rooms", Number(e.target.value))}
            className={`${INPUT_CLASS} ${hasError("rooms") ? "!border-[#ef4444]" : ""}`}
            placeholder="1"
            min="1"
            max="20"
          />
        </div>

        <div className="mt-2.5 flex flex-col gap-2">
          <label
            htmlFor="capacity-field"
            className="pt-[5px] text-sm font-semibold text-white"
          >
            Вместимость (человек) <span className="required">*</span>
          </label>
          <input
            id="capacity-field"
            type="number"
            value={formData.capacity || ""}
            onChange={(e) => updateField("capacity", Number(e.target.value))}
            className={`${INPUT_CLASS} ${hasError("capacity") ? "!border-[#ef4444]" : ""}`}
            placeholder="2"
            min="1"
            max="35"
          />
        </div>
      </div>

      {/* ===== 4. МЕТРО ===== */}
      <div className="mt-2.5 flex flex-col gap-2">
        <label
          htmlFor="metro-field"
          className="pt-[5px] text-sm font-semibold text-white"
        >
          Метро (минут пешком)
        </label>
        <input
          id="metro-field"
          type="text"
          inputMode="numeric"
          value={formData.metro || ""}
          onChange={(e) =>
            updateField("metro", e.target.value.replace(/\D/g, ""))
          }
          className={INPUT_CLASS}
          placeholder="5 минут до метро"
        />
      </div>

      {/* ===== 5. УДОБСТВА (ЧЕКБОКСЫ) ===== */}
      <div className="mt-2.5 flex flex-col gap-2">
        <label className="pt-[5px] text-sm font-semibold text-white">
          Удобства
        </label>
        <div className="grid grid-cols-3 gap-[8px_16px] py-2 max-md:grid-cols-2 max-[480px]:grid-cols-1">
          {AMENITIES.map((amenity) => (
            <label
              key={amenity.id}
              className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-white transition-colors duration-200 hover:text-[#b552c7]"
            >
              <input
                type="checkbox"
                checked={formData.amenities?.includes(amenity.id) || false}
                onChange={(e) =>
                  handleAmenityToggle(amenity.id, e.target.checked)
                }
                className="h-[18px] w-[18px] min-h-[18px] min-w-[18px] shrink-0 cursor-pointer accent-[#b552c7]"
              />
              {amenity.label}
            </label>
          ))}
        </div>
      </div>

      {/* ===== 6. ПАРКОВКА ===== */}
      <div className="mt-2.5 flex flex-col gap-2">
        <label className="pt-[5px] text-sm font-semibold text-white">
          Парковка
        </label>
        <div className="radio-group flex flex-wrap gap-x-6 gap-y-2">
          {PARKING_TYPES.map((type) => (
            <label
              key={type.id}
              className="flex cursor-pointer items-center gap-2 py-2.5 text-sm text-white transition-colors duration-200 hover:text-[#b552c7]"
            >
              <input
                type="radio"
                name="parking"
                value={type.id}
                checked={formData.parking === type.id}
                onChange={() => handleParkingChange(type.id)}
                className="h-[18px] w-[18px] min-h-[18px] min-w-[18px] shrink-0 cursor-pointer accent-[#b552c7]"
              />
              {type.label}
            </label>
          ))}
        </div>
      </div>

      {/* ===== 7. ОПИСАНИЕ ===== */}
      <div className="mt-2.5 flex flex-col gap-2">
        <label
          htmlFor="description-field"
          className="pt-[5px] text-sm font-semibold text-white"
        >
          Описание
        </label>
        <textarea
          id="description-field"
          value={formData.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          className={`${INPUT_CLASS} min-h-[100px] resize-y`}
          placeholder="Опишите квартиру, особенности, что рядом находится..."
          rows={4}
        />
      </div>

      {/* ===== 8. ПРАВИЛА ПРОЖИВАНИЯ ===== */}
      <div className="mt-2.5 flex flex-col gap-2">
        <label
          htmlFor="rules-field"
          className="pt-[5px] text-sm font-semibold text-white"
        >
          Правила проживания <span className="text-[#666]">(необязательно)</span>
        </label>
        <textarea
          id="rules-field"
          value={formData.rules || ""}
          onChange={(e) => updateField("rules", e.target.value)}
          className={`${INPUT_CLASS} min-h-[100px] resize-y`}
          placeholder="Например: без вечеринок, без животных, курение запрещено, заезд после 14:00..."
          rows={4}
        />
      </div>

      {/* ===== ПАНЕЛЬ С ИНФОРМАЦИЕЙ ===== */}
      <div
        className="mt-5 p-[5px] text-[13px] text-[rgba(216,214,214,0.911)]"
        aria-live="polite"
      >
        <p>{getTypeLabel(formData.type)}</p>
        <p>Адрес: {formData.formattedAddress || "не указан"}</p>
        {formData.metro && <p>Метро: {formData.metro}</p>}
      </div>
    </fieldset>
  );
}
