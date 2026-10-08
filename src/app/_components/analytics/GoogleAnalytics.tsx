import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Подключает Google Analytics 4 (gtag). Активируется только когда задана
// переменная NEXT_PUBLIC_GA_ID, иначе не рендерит ничего.
export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
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
