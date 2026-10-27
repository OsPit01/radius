'use client';

// ============================================================
// CookieSettingsButton — кнопка «Настроить cookie»
// ============================================================
//
// Используется на странице /cookies (внизу документа): любой
// пользователь может передумать и изменить категории в любой
// момент — это требование закона (отзыв/изменение согласия
// не сложнее его дачи).
// ============================================================

import { useCookieConsent } from '@/components/consent/CookieConsentContext';

export function CookieSettingsButton() {
    const { openSettings } = useCookieConsent();

    return (
        <button
            type="button"
            onClick={openSettings}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[30px] border border-border px-8 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
            Настроить cookie
        </button>
    );
}
