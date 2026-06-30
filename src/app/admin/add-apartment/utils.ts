// ===== 1. ПОЛУЧИТЬ НАЗВАНИЕ ТИПА ДЛЯ ОТОБРАЖЕНИЯ =====
import type { FormData } from "./page";

export function getTypeLabel(type: string): string {
  const types: Record<string, string> = {
    apartment: "тип обьекта: квартира, апартаменты",
    cottage: "тип обьекта: коттедж, дом",
  };

  return types[type] ?? type;
}
// повтори завтра заново  удали и сам напиши
// export function getFormLabel(formData: FormData, field: keyof FormData | ""): string {
//   switch(field) {
//     case "city":
//   }
// }

// ===== 6. ФОРМАТИРОВАТЬ ДАННЫЕ ДЛЯ ОТПРАВКИ =====
export function formatApartmentData(formData: FormData) {
  return {
    type: formData.type,
    title: formData.title,
    city: formData.city,
    district: formData.district,
    building: formData.building || undefined,
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
} {
  switch (step) {
    case 1:
      if (!formData.type)
        return { isValid: false, error: "Выберите тип объекта" };
      return { isValid: true, error: null };

    case 2:
      if (formData.city.trim().length < 2) {
        return { isValid: false, error: "Введите город " };
      }
      return { isValid: true, error: null };
    case 3:
      if (formData.street.trim().length < 2) {
        return {
          isValid: false,
          error: "Улица обязательна (минимум 2 символа)",
        };
      }
      if (formData.house.trim().length < 1) {
        return { isValid: false, error: "Номер дома обязателен" };
      }
      if (formData.district.trim().length < 2) {
        return {
          isValid: false,
          error: "Район обязателен (минимум 2 символа)",
        };
      }
      return { isValid: true, error: null };
    case 4:
      if (!formData.title.trim())
        return { isValid: false, error: "Введите заголовок" };
      if (!formData.image.trim())
        return { isValid: false, error: "Добавьте URL изображения" };
      if (!formData.price) return { isValid: false, error: "Укажите цену" };
      if (formData.capacity < 1)
        return { isValid: false, error: "Минимальная вместимость - 1 человек" };
      return { isValid: true, error: null };
    default:
      return { isValid: true, error: null };
  }
}
