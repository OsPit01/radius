import '@/styles/globals.css';

import { useEffect, useState } from 'react';

import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';

import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { VisitTracker } from '@/components/analytics/VisitTracker';
import { CookieConsentProvider } from '@/components/consent/CookieConsentProvider';
import { Footer } from '@/components/layout/Footer';
import { Seo } from '@/components/Seo';
import { SupportChatButton } from '@/components/SupportChatButton';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NOINDEX_PATHS } from '@/lib/seo';
import { TRPCReactProvider } from '@/trpc/react';

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
});

/**
 * Страница объекта грузится на сервере (getServerSideProps), и пока идёт
 * переход, показываем спиннер — как раньше `loading.tsx` в App Router.
 */
function useIsApartmentLoading() {
    const router = useRouter();
    const [pendingUrl, setPendingUrl] = useState<string | null>(null);

    useEffect(() => {
        const start = (url: string) => setPendingUrl(url);
        const end = () => setPendingUrl(null);

        router.events.on('routeChangeStart', start);
        router.events.on('routeChangeComplete', end);
        router.events.on('routeChangeError', end);
        return () => {
            router.events.off('routeChangeStart', start);
            router.events.off('routeChangeComplete', end);
            router.events.off('routeChangeError', end);
        };
    }, [router.events]);

    return pendingUrl?.startsWith('/apartments/') ?? false;
}

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const isApartmentLoading = useIsApartmentLoading();

    const noindex = NOINDEX_PATHS.some((path) => router.pathname === path || router.pathname.startsWith(`${path}/`));

    return (
        <>
            <Head>
                <meta
                    key="viewport"
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <style
                    key="font-vars"
                    dangerouslySetInnerHTML={{
                        __html: `:root{--font-geist-sans:${inter.style.fontFamily}}`,
                    }}
                />
            </Head>

            <Seo noindex={noindex} />

            <ThemeProvider>
                {/* Согласие на cookie: единый источник для GA, счётчика
                    визитов, баннера и окна настроек (см. components/consent). */}
                <CookieConsentProvider>
                    <div className="flex min-h-screen flex-col">
                        <GoogleAnalytics />

                        <SessionProvider>
                            <TRPCReactProvider>
                                <div className="flex-1">
                                    {isApartmentLoading ? (
                                        <LoadingSpinner label="Идёт загрузка объекта..." />
                                    ) : (
                                        <Component {...pageProps} />
                                    )}
                                </div>
                                <SupportChatButton />
                                <VisitTracker />
                            </TRPCReactProvider>
                        </SessionProvider>
                        <Footer />
                    </div>
                </CookieConsentProvider>
            </ThemeProvider>
        </>
    );
}
