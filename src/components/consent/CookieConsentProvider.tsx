'use client';

// ============================================================
// CookieConsentProvider — провайдер согласия на cookie
// ============================================================
//
// Один источник правды о согласии для всего приложения:
// баннер, окно настроек, GoogleAnalytics и VisitTracker читают
// состояние отсюда через хук useCookieConsent().
//
// Состояние:
// - consent === null → выбор ещё не сделан (или версия устарела);
// - consent ≠ null → выбор сделан, категории внутри.
//
// «ready» нужен, чтобы не мигнуть баннером до того, как мы
// успели прочитать localStorage после гидрации.
// ============================================================

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CookieBanner } from '@/components/consent/CookieBanner';
import type { CookieConsentContextValue } from '@/components/consent/CookieConsentContext';
import { CookieConsentContext } from '@/components/consent/CookieConsentContext';
import { CookieSettingsModal } from '@/components/consent/CookieSettingsModal';
import type { CookieConsent } from '@/lib/cookie-consent';
import { ONLY_NECESSARY, readCookieConsent, saveCookieConsent } from '@/lib/cookie-consent';

export function CookieConsentProvider({ children }: { children: ReactNode }) {
    const [consent, setConsent] = useState<CookieConsent | null>(null);
    const [ready, setReady] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Читаем сохранённый выбор один раз после монтирования:
    // localStorage есть только в браузере, на сервере его нет.
    useEffect(() => {
        setConsent(readCookieConsent());
        setReady(true);
    }, []);

    const acceptAll = useCallback(() => {
        setConsent(saveCookieConsent({ necessary: true, analytics: true, marketing: true }));
    }, []);

    const rejectNonEssential = useCallback(() => {
        setConsent(saveCookieConsent(ONLY_NECESSARY));
    }, []);

    const save = useCallback((categories: Parameters<CookieConsentContextValue['save']>[0]) => {
        setConsent(saveCookieConsent(categories));
    }, []);

    const openSettings = useCallback(() => {
        setSettingsOpen(true);
    }, []);

    const value = useMemo<CookieConsentContextValue>(
        () => ({ consent, ready, acceptAll, rejectNonEssential, save, openSettings }),
        [consent, ready, acceptAll, rejectNonEssential, save, openSettings],
    );

    return (
        <CookieConsentContext.Provider value={value}>
            {children}

            {/* Баннер — только тем, кто ещё не делал выбор */}
            <CookieBanner
                visible={ready && consent === null && !settingsOpen}
                onOpenSettings={openSettings}
            />

            {/* Окно настроек доступно в любой момент — из баннера и со страницы /cookies */}
            <CookieSettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </CookieConsentContext.Provider>
    );
}
