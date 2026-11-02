// ============================================================
// ТИПЫ ПЛАТЕЛЬЩИКА (физлицо / ИП / компания)
//
// АРХИТЕКТУРА — как у ролей (roles.ts): ОДИН корень значений,
// всё остальное выводится. Подписи для UI — отдельной картой:
// домен (enum, zod, сравнения) не знает про экраны.
//
// УНП у ВСЕХ типов плательщика в РБ — ровно 9 цифр, букв не бывает.
// Валидация УНП — в lib/schemas/apartment.ts (unp: /^\d{9}$/).
// ============================================================

// ================== ДОМЕН: только значения ==================
// Единственный корень для z.enum, pgEnum (schema.ts) и сравнений.
export const PAYER_TYPE_VALUES = ['individual', 'ip', 'company'] as const;
export type PayerType = (typeof PAYER_TYPE_VALUES)[number];

// ============ ПРЕЗЕНТАЦИЯ: подписи для интерфейса ============
// Record<PayerType, string> — компилятор проверит: забыл тип → ошибка сборки.
export const PAYER_TYPE_LABELS: Record<PayerType, string> = {
    individual: 'Физическое лицо',
    ip: 'ИП',
    company: 'Компания',
};

// Опции для дропдаунов — ВЫВОДЯТСЯ из корня, не пишутся руками.
export const PAYER_TYPE_OPTIONS = PAYER_TYPE_VALUES.map((v) => ({
    value: v,
    label: PAYER_TYPE_LABELS[v],
}));

// ============ ВАЛИДАЦИЯ НА ГРАНИЦЕ (паттерн ролей) ============

/** Строка — один из наших типов плательщика? Type-guard: сужает string → PayerType. */
export function isPayerType(value: string | null | undefined): value is PayerType {
    return !!value && (PAYER_TYPE_VALUES as readonly string[]).includes(value);
}

/** Подпись типа для UI; мусор из БД → '—' (а не undefined, как у старого .find). */
export function getPayerLabel(value: string | null | undefined): string {
    return isPayerType(value) ? PAYER_TYPE_LABELS[value] : '—';
}
