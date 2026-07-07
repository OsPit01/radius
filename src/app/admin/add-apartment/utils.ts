//  ПОЛУЧИТЬ НАЗВАНИЕ ТИПА
import type { FormData } from "./page";

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
      return `Город: ${formData.city || "не указан"}`;

    case "district":
      return `Район: ${formData.district || "не указан"}`;

    case "full_address":
      if (!formData.street && !formData.building) return "Адрес: не заполнен";
      // Склеиваем
      return `г. ${formData.city}, ул. ${formData.street}, д. /корп ${formData.building}`;

    default:
      return String(formData[field as keyof FormData]);
  }
}

// ===== 6. ФОРМАТИРОВАТЬ ДАННЫЕ ДЛЯ ОТПРАВКИ =====
export function formatApartmentData(formData: FormData) {
  const cityClean = formData.city.trim();
  const streetClean = formData.street.trim();
  const numberHomeClean = formData.numberHome.trim();
  const buildingClean = formData.building.trim();

  const fullAddressForMap = [cityClean, streetClean, buildingClean]
    .filter(Boolean)
    .join(", "); // булеан удаляет пустые строки ,join склеивает
  return {
    type: formData.type,
    title: formData.title,
    city: cityClean,
    street: streetClean,
    numberHome: numberHomeClean,
    district: formData.district,
    building: buildingClean || undefined,
    formattedAddress: fullAddressForMap,
    capacity: Number(formData.capacity),
    price: Number(formData.price),
    image: formData.image,
    description: formData.description || undefined,
    rooms: Number(formData.rooms),
    metro: formData.metro || undefined,
  };
}
// ===== 7. ВАЛИДАЦИЯ ШАГОВ (используется в page.tsx для перехода) =====
export function validateStep(
  step: number,
  formData: FormData,
): {
  isValid: boolean;
  error: string | null;
  fields: (keyof FormData)[];
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
      if (formData.street.trim().length < 2) badFields.push("street");
      if (formData.district.trim().length < 2) badFields.push("district");

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
      if (!formData.image.trim()) badFields.push("image");
      if (!formData.price) badFields.push("price");
      if (formData.capacity < 1) badFields.push("capacity");

      if (badFields.length > 0) {
        return {
          isValid: false,
          error: "Заполните обязательные детали объекта",
          fields: badFields,
        };
      }
      return { isValid: true, error: null, fields: [] };
    }

    default:
      return { isValid: true, error: null, fields: [] };
  }
}
