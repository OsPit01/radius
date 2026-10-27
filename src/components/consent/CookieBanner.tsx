'use client';

// ============================================================
// CookieBanner — баннер выбора cookie при первом заходе
// ============================================================
//
// Юридическая разница со старым баннером:
// раньше было «Продолжая пользоваться сайтом, вы соглашаетесь…» —
// это согласие молчанием, закон его не признаёт. Теперь три явных
// действия: «Принять все» / «Только необходимые» / «Настроить»,
// а аналитика и реклама включаются ТОЛЬКО после выбора.
// ============================================================

import Link from 'next/link';

import { useCookieConsent } from '@/components/consent/CookieConsentContext';

type CookieBannerProps = {
    /** Показывать ли баннер (провайдер сам решает, исходя из consent). */
    visible: boolean;
    /** Открыть окно настроек. */
    onOpenSettings: () => void;
};

// Единый стиль кнопок: высота 44px+ — удобно попадать пальцем на телефоне.
const BUTTON_BASE =
    'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[30px] px-6 py-2.5 text-sm font-medium transition-colors';

export function CookieBanner({ visible, onOpenSettings }: CookieBannerProps) {
    const { acceptAll, rejectNonEssential } = useCookieConsent();

    if (!visible) {
        return null;
    }

    return (
        <div className="fixed right-0 bottom-0 left-0 z-[950] p-4">
            <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_10px_40px_rgba(0,0,0,0.15)] sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-relaxed text-foreground">
                    Мы используем cookie для работы сайта. Аналитика и реклама — только с вашего согласия, изменить
                    выбор можно в любой момент в{' '}
                    <Link
                        href="/cookies"
                        className="text-primary underline hover:text-primary/80"
                    >
                        Политике cookie
                    </Link>
                    .
                </p>
                <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row">
                    <button
                        type="button"
                        onClick={acceptAll}
                        className={`${BUTTON_BASE} bg-foreground text-background hover:bg-foreground/85`}
                    >
                        Принять все
                    </button>
                    <button
                        type="button"
                        onClick={rejectNonEssential}
                        className={`${BUTTON_BASE} border border-border text-foreground hover:border-primary hover:text-primary`}
                    >
                        Только необходимые
                    </button>
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className={`${BUTTON_BASE} px-4 text-muted-foreground underline hover:text-primary`}
                    >
                        Настроить
                    </button>
                </div>
            </div>
        </div>
    );
}
