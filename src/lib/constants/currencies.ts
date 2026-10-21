// src/lib/constants/currencies.ts
export const CURRENCIES = [
    { value: 'BYN', symbol: 'Br', label: 'Br (Бел. руб)' },
    { value: 'USD', symbol: '$', label: '$ (Доллар)' },
    { value: 'EUR', symbol: '€', label: '€ (Евро)' },
    { value: 'RUB', symbol: '₽', label: '₽ (Рос. руб)' },
] as const;

export type Currency = (typeof CURRENCIES)[number];

// Возвращает символ валюты для отображения цены (например "Br" для BYN).
// Если валюта не найдена — возвращаем её код как есть (безопасный fallback).
export function getCurrencySymbol(currency: string | null | undefined): string {
    return CURRENCIES.find((c) => c.value === currency)?.symbol ?? currency ?? '';
}
