import Script from "next/script";

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
export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      {/* 1. Default-согласие: устанавливается как можно раньше (до gtag.js). */}
      <Script id="ga-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied'
          });
        `}
      </Script>

      {/* 2. Загрузка gtag.js. */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      {/* 3. Инициализация GA (данные не пишутся, пока consent = denied). */}
      <Script id="ga-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
