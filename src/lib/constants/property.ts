// src/lib/constants/property.ts
export const PROPERTY_TYPES = ['Квартира', 'Дом', 'Комната', 'Офис', 'Склад', 'Магазин'] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

const TYPE_LABELS: Record<string, string> = {
    apartment: 'квартира, апартаменты',
    cottage: 'коттедж, дом',
};

export function getTypeLabel(type: string): string {
    return TYPE_LABELS[type] ?? type;
}
