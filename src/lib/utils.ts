"use client";

import { useState } from "react";

// ============================================================
// 1. ТИПЫ
// ============================================================

export type FormData = {
  type: string;
  city: string;
  cityError: string;
  street: string;
  numberHome: string;
  building: string;
  formattedAddress: string;
  district: string;
  addressError: string;
  title: string;
  capacity: number;
  price: number;
  currency: string;
  rooms: number;
  image: string;
  description: string;
  metro: string;
  amenities: string[];
  parking: string;
  images: string[];
};

// ============================================================
// 2. АДРЕС
// ============================================================

export function generateFormattedAddress(formData: FormData): string {
  const cityClean = formData.city?.trim() ?? "";
  const streetClean = formData.street?.trim() ?? "";
  const numberHomeClean = formData.numberHome?.trim() ?? "";
  const buildingClean = formData.building?.trim() ?? "";

  let address = cityClean;
  if (streetClean) address += `, ул. ${streetClean}`;
  if (numberHomeClean) address += `, д. ${numberHomeClean}`;
  if (buildingClean) address += `/${buildingClean}`;

  return address;
}

// !!!!! ДОБАВЬ ЭТУ ФУНКЦИЮ !!!!!
export function updateFieldWithAddress(
  field: keyof FormData,
  value: string | number | string[],
  prevData: FormData,
): FormData {
  const newData = { ...prevData, [field]: value };
  if (["city", "street", "numberHome", "building"].includes(field)) {
    newData.formattedAddress = generateFormattedAddress(newData);
  }
  return newData;
}

// ============================================================
// 3. ФОРМАТИРОВАНИЕ (ДОБАВЬ ЭТУ ФУНКЦИЮ)
// ============================================================

export function formatApartmentData(formData: FormData) {
  const fullAddressForMap = generateFormattedAddress(formData);
  return {
    type: formData.type,
    title: formData.title,
    city: formData.city?.trim() ?? "",
    street: formData.street?.trim() ?? "",
    numberHome: formData.numberHome?.trim() ?? "",
    district: formData.district?.trim() ?? "",
    building: formData.building?.trim() ?? null,
    formattedAddress: fullAddressForMap,
    capacity: Number(formData.capacity ?? 0),
    price: Number(formData.price ?? 0),
    currency: formData.currency ?? "BYN",
    image: formData.image,
    description: formData.description ?? undefined,
    rooms: Number(formData.rooms ?? 0),
    metro: formData.metro ?? undefined,
    amenities: formData.amenities ?? [],
    parking: formData.parking ?? "",
    images: formData.images ?? [],
  };
}

// ============================================================
// 4. ВАЛИДАЦИЯ (ДОБАВЬ ЭТУ ФУНКЦИЮ)
// ============================================================

export function validateStep(
  step: number,
  formData: FormData,
): {
  isValid: boolean;
  error: string | null;
  fields?: (keyof FormData)[];
} {
  switch (step) {
    case 1:
      if (!formData.type) {
        return {
          isValid: false,
          error: "Выберите тип объекта",
          fields: ["type"],
        };
      }
      return { isValid: true, error: null, fields: [] };

    case 2:
      if (formData.city.trim().length < 2) {
        return { isValid: false, error: "Введите город", fields: ["city"] };
      }
      return { isValid: true, error: null, fields: [] };

    case 3: {
      const badFields: (keyof FormData)[] = [];
      if (formData.street.trim().length < 2) badFields.push("street");
      if (formData.numberHome.trim().length < 1) badFields.push("numberHome");
      if (badFields.length > 0) {
        return {
          isValid: false,
          error: "Заполните обязательные поля адреса",
          fields: badFields,
        };
      }
      return { isValid: true, error: null, fields: [] };
    }

    case 4: {
      const badFields: (keyof FormData)[] = [];
      if (!formData.title.trim()) badFields.push("title");
      if (!formData.price) badFields.push("price");
      if (formData.capacity < 1) badFields.push("capacity");
      if (!formData.rooms || formData.rooms < 1) badFields.push("rooms");
      if (formData.rooms > 10) badFields.push("rooms");
      if (badFields.length > 0) {
        return {
          isValid: false,
          error: "Заполните обязательные детали объекта",
          fields: badFields,
        };
      }
      return { isValid: true, error: null, fields: [] };
    }

    case 5: {
      const badFields: (keyof FormData)[] = [];
      if (!formData.images || formData.images.length === 0)
        badFields.push("images");
      if (!formData.image) badFields.push("image");
      if (badFields.length > 0) {
        return {
          isValid: false,
          error: "Добавьте хотя бы одну фотографию",
          fields: badFields,
        };
      }
      return { isValid: true, error: null, fields: [] };
    }

    default:
      return { isValid: true, error: null, fields: [] };
  }
}

// ============================================================
// 5. ЛЕЙБЛЫ
// ============================================================

export function getTypeLabel(type: string): string {
  const types: Record<string, string> = {
    apartment: "квартира, апартаменты",
    cottage: "коттедж, дом",
  };
  return types[type] ?? type;
}

export function getFormLabel(
  formData: FormData,
  field: keyof FormData | "full_address",
): string {
  switch (field) {
    case "city":
      return `Город: ${formData.city ?? "не указан"}`;
    case "district":
      return `Район: ${formData.district ?? "не указан"}`;
    case "full_address":
      if (!formData.street && !formData.building) return "Адрес: не заполнен";
      return `г. ${formData.city}, ул. ${formData.street}, д. /корп ${formData.building}`;
    case "formattedAddress": {
      const fullAddress = generateFormattedAddress(formData);
      return `Адрес: ${fullAddress ?? "не указан"}`;
    }
    default:
      return String(formData[field as keyof FormData]);
  }
}

// ============================================================
// 6. КЛАССЫ ДЛЯ INPUT
// ============================================================

export function getInputClassName(
  value: string | number,
  field: keyof FormData,
  errorFields: (keyof FormData)[],
  baseClass: "city-input" | "default" = "default",
): string {
  const text = String(value).trim();
  const hasText = text.length > 0;
  const isInvalid = errorFields.includes(field);

  if (baseClass === "city-input") {
    const classes = ["city-input"];
    if (hasText) classes.push("has-text");
    if (hasText && !isInvalid) classes.push("valid");
    if (isInvalid) classes.push("error");
    return classes.join(" ");
  }
  return isInvalid ? "error-input" : "";
}

// ============================================================
// 7. ФОРМА
// ============================================================

export function useForm<T extends Record<string, unknown>>(initialData: T) {
  const [formData, setFormData] = useState<T>(initialData);

  const updateField = <K extends keyof T>(field: K, value: T[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialData);
  };

  const fillForm = (data: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return {
    formData,
    setFormData,
    updateField,
    resetForm,
    fillForm,
  };
}
