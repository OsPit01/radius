import '@/styles/globals.css';

import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';

import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { VisitTracker } from '@/components/analytics/VisitTracker';
import { CookieConsentProvider } from '@/components/consent/CookieConsentProvider';
import { SupportChatButton } from '@/components/support/SupportChatButton';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { TRPCReactProvider } from '@/trpc/react';

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
});

export default function App({ Component, pageProps }: AppProps) {
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

            <ThemeProvider>
                <CookieConsentProvider>
                    <div className="flex min-h-dvh flex-col">
                        <GoogleAnalytics />

                        <SessionProvider>
                            <TRPCReactProvider>
                                <Component {...pageProps} />
                                <SupportChatButton />
                                <VisitTracker />
                            </TRPCReactProvider>
                        </SessionProvider>
                    </div>
                </CookieConsentProvider>
            </ThemeProvider>
        </>
    );
}
