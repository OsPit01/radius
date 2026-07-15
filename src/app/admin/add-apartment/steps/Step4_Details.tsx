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
  // ===== ФУНКЦИЯ ДЛЯ ПРОВЕРКИ ОШИБОК =====
  const hasError = (field: keyof FormData) => errorFields.includes(field);

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
          className={hasError("title") ? "error-input" : ""}
          placeholder="Например уютная студия в центре города"
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
            min="30"
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
            min="1"
            max="20"
          />
        </div>
        <div className="form-group">
          <label htmlFor="capacity-field">Вместимость (человек) *</label>
          <input
            id="capacity-field"
            type="number"
            value={formData.capacity || ""}
            onChange={(e) => updateField("capacity", Number(e.target.value))}
            placeholder="2"
            min="1"
            max="35"
          ></input>
          {/* ===== МЕТРО ===== */}
          <div className="form-group">
            <label htmlFor="metro-field">Метро (минут пешком)</label>
            <input
              id="metro-field"
              type="text"
              value={formData.metro || ""}
              onChange={(e) => updateField("metro", e.target.value)}
              placeholder="5 минут до метро"
            />
          </div>
        </div>
      </div>
      {/* ===== 5. УДОБСТВА (ЧЕКБОКСЫ) ===== */}

      <div className="form-group">
        <label>Удобства</label>
        <div className="amenities-grid">
          {AMENITIES.map((amenity) => (
            <label key={amenity.id} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.amenities?.includes(amenity.id) || false}
                onChange={(e) =>
                  handleAmenityToggle(amenity.id, e.target.checked)
                }
              />
              {amenity.label}
            </label>
          ))}
        </div>
      </div>
      {/* ===== 6. ПАРКОВКА ===== */}
      <div className="form-group">
        <label>Парковка</label>
        <div className="radoi-group">
          {PARKING_TYPES.map((type) => (
            <label key={type.id} className="radio-label">
              <input
                type="radio"
                name="parking"
                value={type.id}
                checked={formData.parking === type.id}
                onChange={() => handleParkingChange(type.id)}
              />
              {type.label}
            </label>
          ))}
        </div>
      </div>
      {/* ===== 8. ОПИСАНИЕ ===== */}
      <div className="form-group">
        <label htmlFor="description-field">Описание</label>
        <textarea
          id="description-field"
          value={formData.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Опишите квартиру, особенности, что рядом находится..."
          rows={4}
        />
      </div>
      {/* Панель заполненной информации предыдущих шагов */}
      <div className="summary-panel" aria-live="polite">
        <p>{getTypeLabel(formData.type)}</p>
        <p>{getTypeLabel(formData.formattedAddress)}</p>
      </div>
    </fieldset>
  );
}
