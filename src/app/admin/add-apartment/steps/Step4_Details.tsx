"use client";

import { CustomSelect } from "../components/CustomSelect";
import type { FormData } from "../page";
import {
  getInputClassName,
  getTypeLabel,
  AMENITIES,
  PARKING_TYPES,
  toggleArrayItem,
} from "../utils";

type Step4_DetailsProps = {
  formData: FormData;
  updateField: (
    field: keyof FormData,
    value: string | number | string[],
  ) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  error?: string | null;
  errorFields: (keyof FormData)[];
};

const CURRENCIES = [
  { value: "BYN", label: "Br (Бел. руб)" },
  { value: "USD", label: "$ (Доллар)" },
  { value: "EUR", label: "€ (Евро)" },
  { value: "RUB", label: "₽ (Рос. руб)" },
];

export function Step4_Details({
  formData,
  updateField,
  error,
  errorFields, // Принимаем массив ошибок для автоматической подсветки полей
}: Step4_DetailsProps) {
  // ===== ФУНКЦИЯ ДЛЯ ЧЕКБОКСОВ УДОБСТВ =====
  const handleAmenityToggle = (amenityId: string, checked: boolean) => {
    const current = formData.amenities || [];
    if (checked) {
      updateField("amenities", [...current, amenityId]);
    } else {
      updateField(
        "amenities",
        current.filter((item) => item !== amenityId),
      );
    }
  };
  // ===== ФУНКЦИЯ ДЛЯ РАДИО КНОПОК ПАРКОВКИ =====
  const handleParkingChange = (value: string) => {
    updateField("parking", value);
  };
  return (
    <fieldset className="step">
      <legend className="step-title">Шаг 4: Детали объекта</legend>
      {error && (
        <div className="error" role="alert">
          {" "}
          {error}
        </div>
      )}
      {/* Поле Заголовка */}
      <div className="form-group">
        <label> Напишите заголовок </label>
        <input
          id="title-field"
          type="text"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Например уютная студия в центре города"
          className={getInputClassName(formData.title, "title", errorFields)}
        />
      </div>
      {/* ===== ЦЕНА И КОМНАТЫ ===== */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="price-field"> Цена за сутки </label>
          <input
            id="price-field"
            type="number"
            value={formData.price || ""}
            onChange={(e) => updateField("price", Number(e.target.value))}
            placeholder="100"
            className={getInputClassName(formData.price, "price", errorFields)}
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="currency-field"> Валюта</label>
          <CustomSelect
            options={CURRENCIES}
            value={formData.currency ?? "BYN"}
            onChange={(value) => updateField("currency", value)}
          />
        </div>
      </div>
      {/* ===== КОМНАТЫ И ВМЕСТИМОСТЬ ===== */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="rooms-field">Количество комнат</label>
          <input
            id="rooms-field"
            type="number"
            value={formData.rooms || ""}
            onChange={(e) => updateField("rooms", Number(e.target.value))}
            placeholder="1"
            className={errorFields.includes("rooms") ? "error-input" : ""}
            min="0"
          />
        </div>
      </div>

      {/* Панель заполненной информации предыдущих шагов */}
      <div className="summary-panel" aria-live="polite">
        <p>{getTypeLabel(formData.type)}</p>
        <p>{getTypeLabel(formData.formattedAddress)}</p>
      </div>
    </fieldset>
  );
}
