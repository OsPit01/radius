'use client';

// ============================================================
// GoogleAnalytics — подключение GA4 и Google Ads ПОСЛЕ согласия
// ============================================================
//
// Как это работает теперь:
// 1. В _document.tsx остаётся «согласие по умолчанию — всё запрещено»
//    (denied). Это защита на самый ранний момент загрузки.
// 2. НИЖЕ (здесь) скрипт gtag.js вообще НЕ загружается, пока
//    пользователь не дал согласие на «Аналитику» или «Маркетинг».
//    Никаких запросов к Google до выбора — ни cookie, ни пикселей.
// 3. После выбора категорий сюда приходят значения и в gtag
//    отправляется обновлённое состояние согласия:
//    аналитика → analytics_storage, реклама → ad_storage и связанные.
//
// Категории независимы: можно включить аналитику без рекламы —
// тогда GA работает, а конверсии Google Ads не подключаются.
// ============================================================

import Script from 'next/script';

import { useCookieConsent } from '@/components/consent/CookieConsentContext';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
    const { consent } = useCookieConsent();

    // Активируется только когда задан NEXT_PUBLIC_GA_ID, иначе ничего не рендерит.
    if (!GA_ID) {
        return null;
    }

    // Согласия ещё нет (не прочитано или пользователь не решал) — не грузим Google.
    if (!consent) {
        return null;
    }

    const analytics = consent.categories.analytics;
    const marketing = consent.categories.marketing;

    // Ни аналитики, ни маркетинга — Google не нужен вовсе.
    if (!analytics && !marketing) {
        return null;
    }

    return (
        <>
            {/* Загрузка gtag.js — только после выбора категорий. */}
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="lazyOnload"
            />

            {/* Инициализация: обновляем состояние согласия ФАКТИЧЕСКИМ выбором
                пользователя и только затем конфигурируем счётчик. */}
            <Script
                id="ga-config"
                strategy="afterInteractive"
            >
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'update', {
            'ad_storage': ${marketing ? "'granted'" : "'denied'"},
            'ad_user_data': ${marketing ? "'granted'" : "'denied'"},
            'ad_personalization': ${marketing ? "'granted'" : "'denied'"},
            'analytics_storage': ${analytics ? "'granted'" : "'denied'"}
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
            </Script>

            {/* Конверсия Google Ads: вызывается из кода (reportConversion)
                при бронировании. Подключается только при согласии на «Рекламу». */}
            {marketing && (
                <Script
                    id="ga-conversion"
                    strategy="afterInteractive"
                >
                    {`
          window.gtag_report_conversion = function (url) {
            var callback = function () {
              if (typeof url !== 'undefined') {
                window.location = url;
              }
            };
            gtag('event', 'conversion', {
              'send_to': 'AW-18503326894/oKtLCP6e5pYdEK65ifdE',
              'value': 1.0,
              'currency': 'USD',
              'event_callback': callback
            });
            return false;
          };
        `}
                </Script>
            )}
        </>
    );
}
