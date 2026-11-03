// src/lib/constants/property.ts
// Корень — английские слоги, как они хранятся в БД.
// (Прежний PROPERTY_TYPES с русскими словами удалён: он врал — БД хранит слоги.)

export const APARTMENT_TYPE_VALUES = ['apartment', 'cottage'] as const;
export type ApartmentType = (typeof APARTMENT_TYPE_VALUES)[number];

// Подписи для UI (слог → русский текст)
export const APARTMENT_TYPE_LABELS: Record<ApartmentType, string> = {
    apartment: 'квартира, апартаменты',
    cottage: 'коттедж, дом',
};
/** Подпись типа для UI; мусор из БД → показываем как есть (валидация на границе) */
export function getTypeLabel(type: string): string {
    return APARTMENT_TYPE_LABELS[type as ApartmentType] ?? type;
}
