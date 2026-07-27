// src/lib/constants/currencies.ts
export const CURRENCIES = [
  { value: "BYN", label: "Br (Бел. руб)" },
  { value: "USD", label: "$ (Доллар)" },
  { value: "EUR", label: "€ (Евро)" },
  { value: "RUB", label: "₽ (Рос. руб)" },
] as const;

export type Currency = (typeof CURRENCIES)[number];
