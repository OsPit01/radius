import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "@/trpc/react";
import { Footer } from "@/app/_components/layout/Footer";
import { CookieConsent } from "@/app/_components/ui/CookieConsent";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — аренда жилья посуточно`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — аренда жилья посуточно`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — аренда жилья посуточно`,
    description: SITE_DESCRIPTION,
  },
  verification: {
    google: "w6kQbPKfMNh_S0ipt0xk7TRfCczM7rvMH0uuDrkAAJw",
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${geist.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SessionProvider>
          <TRPCReactProvider>
            <div className="flex-1">{children}</div>
          </TRPCReactProvider>
        </SessionProvider>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
