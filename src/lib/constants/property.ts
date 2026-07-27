// src/lib/constants/property.ts
export const PROPERTY_TYPES = [
  "Квартира",
  "Дом",
  "Комната",
  "Офис",
  "Склад",
  "Магазин",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
