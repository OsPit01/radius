// ============================================================
// src/lib/cookie-consent.ts — СОСТОЯНИЕ СОГЛАСИЯ НА COOKIE
// ============================================================
//
// Хранит выбор пользователя в localStorage:
// { version: 1, decidedAt: '<ISO-дата>', categories: {...} }.
//
// Зачем хранить версию: если мы изменим состав cookie (добавим новую
// аналитику) — поднимем COOKIE_CONSENT_VERSION, у всех пользователей
// выбор «протухнет» и баннер честно спросит согласие заново.
//
// Все функции безопасны на сервере: работают только если есть window
// (иначе возвращают null). Локальное хранилище может быть недоступно
// (приватный режим браузера) — поэтому try/catch.
// ============================================================

export const COOKIE_CONSENT_STORAGE_KEY = 'naradare-cookie-consent';

export const COOKIE_CONSENT_VERSION = 1;

/** Категории согласия. `necessary` всегда true и не отключается. */
export type CookieConsentCategories = {
    necessary: true;
    analytics: boolean;
    marketing: boolean;
};

/** Полная запись о выборе пользователя. */
export type CookieConsent = {
    version: number;
    /** ISO-дата выбора — когда пользователь принимал решение. */
    decidedAt: string;
    categories: CookieConsentCategories;
};

/** Все категории выключены, кроме необходимых. */
export const ONLY_NECESSARY: CookieConsentCategories = {
    necessary: true,
    analytics: false,
    marketing: false,
};

/** Читает сохранённый выбор. null = ещё не выбирали или версия устарела. */
export function readCookieConsent(): CookieConsent | null {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as CookieConsent;
        // Версия не совпала — считаем, что согласия нет, спрашиваем заново.
        if (parsed.version !== COOKIE_CONSENT_VERSION) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

/** Сохраняет выбор и возвращает его же — чтобы сразу использовать. */
export function saveCookieConsent(categories: CookieConsentCategories): CookieConsent {
    const consent: CookieConsent = {
        version: COOKIE_CONSENT_VERSION,
        decidedAt: new Date().toISOString(),
        categories,
    };
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
        } catch {
            // Хранилище недоступно — согласие живёт до перезагрузки страницы.
        }
    }
    return consent;
}
