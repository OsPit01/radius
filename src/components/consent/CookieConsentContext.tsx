'use client';

// ============================================================
// CookieConsentContext — контекст согласия на cookie
// ============================================================
//
// Вынесен в отдельный файл, чтобы не было кругового импорта:
// Provider импортирует Banner и Modal, а они импортируют только
// этот файл (контекст и хук), а не Provider.
// ============================================================

import { createContext, useContext } from 'react';

import type { CookieConsent, CookieConsentCategories } from '@/lib/cookie-consent';

export type CookieConsentContextValue = {
    /** Сохранённый выбор. null — ещё не прочитали или пользователь не решал. */
    consent: CookieConsent | null;
    /** true — localStorage уже прочитан (можно показывать баннер). */
    ready: boolean;
    /** Согласиться на всё (аналитика + маркетинг). */
    acceptAll: () => void;
    /** Только необходимые cookie. */
    rejectNonEssential: () => void;
    /** Сохранить свой набор категорий (из окна настроек). */
    save: (categories: CookieConsentCategories) => void;
    /** Открыть окно настроек (доступно в любой момент). */
    openSettings: () => void;
};

export const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

/** Хук доступа к согласию. Использовать только внутри провайдера. */
export function useCookieConsent(): CookieConsentContextValue {
    const context = useContext(CookieConsentContext);
    if (!context) {
        throw new Error('useCookieConsent должен вызываться внутри <CookieConsentProvider>');
    }
    return context;
}
