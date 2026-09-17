"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

// ============================================================
// 1. ТИПЫ
// ============================================================

export type FormData = {
  type: string;
  region: string;
  district: string;
  city: string;
  cityDistrict: string;
  cityError: string;
  street: string;
  streetConfirmed: boolean;
  numberHome: string;
  building: string;
  formattedAddress: string;
  addressError: string;
  title: string;
  capacity: number;
  price: number;
  currency: string;
  rooms: number;
  beds: number;
  singleBeds: number;
  doubleSofas: number;
  singleSofas: number;
  image: string;
  description: string;
  rules: string;
  metro: string;
  amenities: string[];
  parking: string;
  images: string[];
  checkInTime: string;
  checkOutTime: string;
  payerType: string;
  unp: string;
  payerName: string;
};

export type StepFieldValue = string | number | string[] | boolean;

export type StepProps = {
  formData: FormData;
  updateField: (field: keyof FormData, value: StepFieldValue) => void;
  setFormData: Dispatch<SetStateAction<FormData>>;
  error?: string | null;
  errorFields: (keyof FormData)[];
};

export type Apartment = {
  id: number;
  title: string;
  city: string;
  district: string;
  capacity: number;
  price: number;
  image: string;
  description: string;
  rooms: number;
  metro: string;
  currency: string;
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
  if (streetClean) address += `, ${streetClean}`;
  if (numberHomeClean) address += `, д. ${numberHomeClean}`;
  if (buildingClean) address += `/${buildingClean}`;

  return address;
}

// !!!!! ДОБАВЬ ЭТУ ФУНКЦИЮ !!!!!
// Очищает поле "Улица": оставляет только текст (буквы, пробелы, тире,
// точки, скобки), убирая цифры и лишние символы, чтобы нельзя было
// случайно вписать номер дома в улицу.
export function sanitizeStreet(value: string): string {
  return value.replace(/[^A-Za-zА-Яа-яЁё\s.\-()]/g, "");
}

export function updateFieldWithAddress(
  field: keyof FormData,
  value: string | number | string[] | boolean,
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
    district:
      formData.cityDistrict?.trim() || formData.district?.trim() || "",
    building: formData.building?.trim() ?? null,
    formattedAddress: fullAddressForMap,
    capacity: Number(formData.capacity ?? 0),
    price: Number(formData.price ?? 0),
    currency: formData.currency ?? "BYN",
    image: formData.image,
    description: formData.description ?? undefined,
    rules: formData.rules ?? undefined,
    rooms: Number(formData.rooms ?? 0),
    beds: Number(formData.beds ?? 0),
    singleBeds: Number(formData.singleBeds ?? 0),
    doubleSofas: Number(formData.doubleSofas ?? 0),
    singleSofas: Number(formData.singleSofas ?? 0),
    metro: formData.metro ?? undefined,
    amenities: formData.amenities ?? [],
    parking: formData.parking ?? "",
    images: formData.images ?? [],
    checkInTime: formData.checkInTime ?? undefined,
    checkOutTime: formData.checkOutTime ?? undefined,
    payerType: formData.payerType ?? "individual",
    unp: formData.unp ?? "",
    payerName: formData.payerName ?? "",
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

    case 2: {
      const badFields: (keyof FormData)[] = [];
      if (!formData.region) badFields.push("region");
      if (!formData.district.trim()) badFields.push("district");
      if (formData.city.trim().length < 2) badFields.push("city");
      if (badFields.length > 0) {
        return {
          isValid: false,
          error: "Выберите область, район и населённый пункт",
          fields: badFields,
        };
      }
      return { isValid: true, error: null, fields: [] };
    }

    case 3: {
      const badFields: (keyof FormData)[] = [];
      if (!formData.streetConfirmed) badFields.push("street");
      if (formData.numberHome.trim().length < 1) badFields.push("numberHome");
      if (badFields.length > 0) {
        return {
          isValid: false,
          error: "Выберите улицу из списка и укажите номер дома",
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
      if (formData.unp.length < 9) badFields.push("unp");
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
      return `г. ${formData.city}, ${formData.street}, д. /корп ${formData.building}`;
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

export const INPUT_CLASS =
  "w-full rounded-xl border-2 border-[#2a1a3a] bg-[#1a0a2a] px-4 py-3 text-base text-white outline-none transition-all duration-300 placeholder:text-[#666] focus:border-[#b552c7] focus:shadow-[0_0_0_3px_rgba(181,82,199,0.2)]";

export const EDIT_INPUT_CLASS =
  "rounded-lg border border-[#3a2a4a] bg-[#f4f0fc] px-3.5 py-2.5 text-base text-[#222] transition-colors duration-200 placeholder:text-[#999] focus:border-[#b552c7] focus:bg-white focus:shadow-[0_0_0_3px_rgba(181,82,199,0.15)] focus:outline-none";

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
    const classes: string[] = [];
    if (hasText && !isInvalid)
      classes.push(
        "border-[#22c55e] bg-[rgba(34,197,94,0.1)] shadow-[0_0_0_3px_rgba(34,197,94,0.15)]",
      );
    if (isInvalid)
      classes.push(
        "border-[#ee7272] bg-[rgba(239,68,68,0.1)] shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
      );
    return classes.join(" ");
  }
  return isInvalid ? "!border-[#ef4444]" : "";
}

// ============================================================
// 7. ФОРМА
// ============================================================

export function toggleAmenity(
  current: string[],
  amenityId: string,
  checked: boolean,
): string[] {
  if (checked) {
    return current.includes(amenityId) ? current : [...current, amenityId];
  }
  return current.filter((item) => item !== amenityId);
}

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
