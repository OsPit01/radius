import { useEffect, useState } from 'react';

import Link from 'next/link';

const STORAGE_KEY = 'cookie-consent';

// Разрешает аналитику/рекламу после согласия пользователя.
// Вызывается и при нажатии «Принять», и при повторном заходе,
// если согласие уже было дано ранее.
function grantConsent() {
    window.gtag?.('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
    });
}

export function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (localStorage.getItem(STORAGE_KEY)) {
            // Уже принимал cookies раньше — сразу разрешаем аналитику.
            grantConsent();
        } else {
            setVisible(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem(STORAGE_KEY, 'accepted');
        setVisible(false);
        grantConsent();
    };

    if (!visible) {
        return null;
    }

    return (
        <div className="fixed right-0 bottom-0 left-0 z-[1100] p-4">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_10px_40px_rgba(0,0,0,0.15)] sm:flex-row sm:justify-between">
                <p className="text-sm text-foreground">
                    Мы используем файлы cookie для корректной работы сайта. Продолжая пользоваться сайтом, вы
                    соглашаетесь с{' '}
                    <Link
                        href="/privacy"
                        className="text-primary underline hover:text-primary/80"
                    >
                        Политикой конфиденциальности
                    </Link>
                    .
                </p>
                <button
                    type="button"
                    onClick={accept}
                    className="shrink-0 cursor-pointer rounded-[30px] bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:bg-foreground/85"
                >
                    Принять
                </button>
            </div>
        </div>
    );
}
