// src/lib/constants/deal-types.ts
export const DEAL_TYPES = [
    { value: 'rent', label: 'Аренда' },
    { value: 'sale', label: 'Продажа' },
    { value: 'daily', label: 'Посуточно' },
    { value: 'commercial', label: 'Коммерческая' },
] as const;

export type DealType = (typeof DEAL_TYPES)[number];
export type DealTypeValue = (typeof DEAL_TYPES)[number]['value'];
