// src/lib/constants/currencies.ts

// Справочник валют: код → символ и название.
export const CURRENCY_INFO = {
    BYN: { symbol: 'Br', label: 'Белорусский рубль' },
    USD: { symbol: '$', label: 'Доллар США' },
    EUR: { symbol: '€', label: 'Евро' },
    RUB: { symbol: '₽', label: 'Российский рубль' },
} as const;

// Список кодов: 'BYN' | 'USD' | 'EUR' | 'RUB'
export type CurrencyCode = keyof typeof CURRENCY_INFO;

// Проверка: строка — один из наших кодов?
export function isCurrencyCode(value: string | null | undefined): value is CurrencyCode {
    return !!value && Object.hasOwn(CURRENCY_INFO, value);
}

// Массив кодов, выведенный из справочника (без ручного дублирования).
export const CURRENCY_CODES = Object.keys(CURRENCY_INFO).filter(isCurrencyCode);

// Базовая валюта площадки. Цена хранится только в ней.
export const BASE_CURRENCY = 'BYN' satisfies CurrencyCode;

// Валюты для будущего пересчёта (без BYN).
export type QuoteCurrency = Exclude<CurrencyCode, typeof BASE_CURRENCY>;

// Символ базовой валюты: 'Br'
export const BASE_CURRENCY_SYMBOL = CURRENCY_INFO[BASE_CURRENCY].symbol;

// Символ по коду. Мусор → пустая строка.
export function getCurrencySymbol(code: string | null | undefined): string {
    return isCurrencyCode(code) ? CURRENCY_INFO[code].symbol : '';
}

// Единый формат цены: 100 → '100 Br'
export function formatByn(amount: number): string {
    return `${amount} ${BASE_CURRENCY_SYMBOL}`;
}
