import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Подключает Google Analytics 4 (gtag) с режимом согласия (consent mode).
//
// Как работает «режим согласия»:
// 1. До загрузки gtag.js объявляем default-состояние — всё ЗАПРЕЩЕНО (denied).
//    Google получает сигналы, но НЕ сохраняет cookies аналитики/рекламы.
// 2. После того как пользователь принял cookies (CookieConsent), вызывается
//    gtag('consent', 'update', { ... 'granted' }) — и аналитика включается.
//
// Активируется только когда задана NEXT_PUBLIC_GA_ID, иначе ничего не рендерит.

// Шаг 1 (default-согласие, `beforeInteractive`) подключается в pages/_document.tsx.
// Ниже — шаги 2–4: загрузка gtag.js, инициализация и функция конверсии.
export function GoogleAnalytics() {
    if (!GA_ID) {
        return null;
    }

    return (
        <>
            {/* 2. Загрузка gtag.js. */}
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
            />

            {/* 3. Инициализация GA (данные не пишутся, пока consent = denied). */}
            <Script
                id="ga-config"
                strategy="afterInteractive"
            >
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
            </Script>

            {/* 4. Конверсия Google Ads: функция вызывается из кода (reportConversion). */}
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
        </>
    );
}
