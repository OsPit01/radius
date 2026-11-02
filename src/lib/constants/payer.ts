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

// ============================================================
// ПРАВИЛА УНП ПО ТИПУ ПЛАТЕЛЬЩИКА (решение владельца, окончательное)
//
// Формат по РБ (МНС / lookuptax / tin-validate, проверено 03.11.2026):
//   физлицо: 2 ЗАГЛАВНЫЕ ЛАТИНСКИЕ буквы + 7 цифр (LLNNNNNNN), пример: MA1953684
//   ИП:      ровно 9 цифр
//   компания: ровно 9 цифр
// Буквы — ТОЛЬКО заглавные латинские (МНС: «большими буквами на английской
// раскладке»). Форма поднимает регистр автоматически; сервер принимает
// только заглавные — строчные отбиваются строгой валидацией.
//
// Карта — ОДИН источник правил: отсюда берут паттерн и zod (сервер),
// и формы (подсказка под полем). satisfies проверяет полноту компилятором.
// ============================================================

export const UNP_RULES = {
    individual: {
        pattern: /^[A-Z]{2}\d{7}$/,
        message: 'УНП физлица — 2 заглавные латинские буквы и 7 цифр, пример: MA1953684',
    },
    ip: {
        pattern: /^\d{9}$/,
        message: 'УНП ИП — ровно 9 цифр',
    },
    company: {
        pattern: /^\d{9}$/,
        message: 'УНП компании — ровно 9 цифр',
    },
} as const satisfies Record<PayerType, { pattern: RegExp; message: string }>;

/** Паттерн УНП для выбранного типа (для форм); мусорный тип → правило физлица. */
export function getUnpRule(payerType: string | null | undefined): { pattern: RegExp; message: string } {
    return isPayerType(payerType) ? UNP_RULES[payerType] : UNP_RULES.individual;
}
