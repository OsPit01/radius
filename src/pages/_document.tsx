import { Head, Html, Main, NextScript } from 'next/document';
import Script from 'next/script';

import { THEME_INIT_SCRIPT } from '@/lib/theme';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function Document() {
    return (
        <Html lang="ru">
            <Head>
                <link
                    rel="icon"
                    href="/favicon-96x96.png"
                    sizes="96x96"
                    type="image/png"
                />
                <link
                    rel="shortcut icon"
                    href="/favicon.ico"
                />
                <link
                    rel="apple-touch-icon"
                    href="/apple-touch-icon.png"
                />
                <link
                    rel="manifest"
                    href="/site.webmanifest"
                />
                <meta
                    name="mobile-web-app-capable"
                    content="yes"
                />
                <meta
                    name="apple-mobile-web-app-title"
                    content="Radius"
                />
                <meta
                    name="google-site-verification"
                    content="w6kQbPKfMNh_S0ipt0xk7TRfCczM7rvMH0uuDrkAAJw"
                />
                {/* Пользовательские цвета темы применяем до первой отрисовки — иначе
            страница мигнёт цветами по умолчанию. См. src/lib/theme.ts */}
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
            </Head>
            <body>
                {/* Google Analytics, шаг 1: default-согласие — всё запрещено (denied),
            пока пользователь не принял cookies. Остальное — в GoogleAnalytics (_app). */}
                {GA_ID && (
                    <Script
                        id="ga-consent-default"
                        strategy="beforeInteractive"
                    >
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
                )}
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
