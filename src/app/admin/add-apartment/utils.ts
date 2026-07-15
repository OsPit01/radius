//  ПОЛУЧИТЬ НАЗВАНИЕ ТИПА
import type { FormData } from "./page";

export function generateFormattedAddress(formData: FormData): string {
  const cityClean = formData.city?.trim() ?? "";
  const streetClean = formData.street?.trim() ?? "";
  const numberHomeClean = formData.numberHome?.trim() ?? "";
  const buildingClean = formData.building.trim() ?? "";
  const parts = [cityClean, streetClean, numberHomeClean].filter(Boolean);
  let address = cityClean;

  if (streetClean) {
    address += `, ул. ${streetClean}`;
  }

  if (numberHomeClean) {
    address += `, д. ${numberHomeClean}`;
  }

  // Корпус через "/" - так понятнее картам
  if (buildingClean) {
    address += `/${buildingClean}`;
  }

  return address;
}
// ===== ОБНОВЛЕНИЕ ПОЛЯ С АВТО-СКЛЕЙКОЙ АДРЕСА =====
export function updateFieldWithAddress(
  field: keyof FormData,
  value: string | number | string[],
  prevData: FormData,
): FormData {
  const newData = { ...prevData, [field]: value };

  // Если изменилось поле адреса - обновляем formattedAddress
  if (["city", "street", "numberHome", "building"].includes(field)) {
    newData.formattedAddress = generateFormattedAddress(newData);
  }

  return newData;
}
export function getTypeLabel(type: string): string {
  const types: Record<string, string> = {
    apartment: "тип обьекта: квартира, апартаменты",
    cottage: "тип обьекта: коттедж, дом",
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
      // Склеиваем
      return `г. ${formData.city}, ул. ${formData.street}, д. /корп ${formData.building}`;
    case "formattedAddress": {
      const fullAddress = generateFormattedAddress(formData);
      return `Адрес объекта: ${fullAddress || "не указан"}`;
    }

    default:
      return String(formData[field as keyof FormData]);
  }
}

// ===== 6. ФОРМАТИРОВАТЬ ДАННЫЕ ДЛЯ ОТПРАВКИ =====
export function formatApartmentData(formData: FormData) {
  const fullAddressForMap = generateFormattedAddress(formData);
  // булеан удаляет пустые строки ,join склеивает
  return {
    type: formData.type,
    title: formData.title,
    city: formData.city?.trim() ?? "",
    street: formData.street?.trim() ?? "",
    numberHome: formData.numberHome?.trim() ?? "",
    district: formData.district?.trim() ?? "",
    building: formData.building?.trim() ?? null,
    formattedAddress: fullAddressForMap, // ← ИСПОЛЬЗУЕТСЯ ЗДЕСЬ
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
// ===== 7. ВАЛИДАЦИЯ ШАГОВ (используется в page.tsx для перехода) =====
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
      if (!formData.type)
        return {
          isValid: false,
          error: "Выберите тип объекта",
          fields: ["type"],
        };
      return { isValid: true, error: null, fields: [] };

    case 2:
      if (formData.city.trim().length < 2) {
        return { isValid: false, error: "Введите город ", fields: ["city"] };
      }
      return { isValid: true, error: null, fields: [] };
    case 3: {
      // Создаем массив, куда соберем все косячные поля на шаге 3
      const badFields: (keyof FormData)[] = [];

      //проверяем улицу
      if (formData.street.trim().length < 2) badFields.push("street");

      // 3. Проверяем  номер дома (numberHome)
      if (formData.numberHome.trim().length < 1) {
        badFields.push("numberHome");
      }

      if (badFields.length > 0) {
        return {
          isValid: false,
          error: "Заполните обязательные поля адреса (минимум 2 символа)",
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
      if (!formData.images || formData.images.length === 0) {
        badFields.push("images");
      }
      if (!formData.image) {
        badFields.push("image");
      }
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
// ===== СПИСКИ ДЛЯ ФОРМ =====
export const AMENITIES = [
  { id: "wifi", label: "Wi-Fi" },
  { id: "tv", label: "Телевизор" },
  { id: "cable", label: "Кабельное ТВ" },
  { id: "airConditioning", label: "Кондиционер" },
  { id: "heating", label: "Отопление" },
  { id: "washingMachine", label: "Стиральная машина" },
  { id: "dishwasher", label: "Посудомоечная машина" },
  { id: "fridge", label: "Холодильник" },
  { id: "microwave", label: "Микроволновая печь" },
  { id: "oven", label: "Духовка" },
  { id: "stove", label: "Плита" },
  { id: "coffeeMachine", label: "Кофемашина" },
  { id: "kettle", label: "Чайник" },
  { id: "hairDryer", label: "Фен" },
  { id: "iron", label: "Утюг" },
  { id: "ironingBoard", label: "Гладильная доска" },
  { id: "gameConsole", label: "Игровая консоль" },
  { id: "babyBed", label: "Детская кроватка" },
];

export const PARKING_TYPES = [
  { id: "free", label: "Бесплатная" },
  { id: "paid", label: "Платная" },
  { id: "underground", label: "Подземная" },
  { id: "guarded", label: "Охраняемая" },
  { id: "absent", label: "Нету" },
];

// ===== ФУНКЦИЯ ДЛЯ ЧЕКБОКСОВ =====
export function toggleArrayItem(
  currentArray: string[],
  item: string,
  checked: boolean,
): string[] {
  if (checked) {
    return [...currentArray, item];
  } else {
    return currentArray.filter((i) => i !== item);
  }
}
