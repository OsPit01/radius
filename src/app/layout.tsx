import "@/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
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
  icons: {
    icon: [{ url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" }],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Radius",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — аренда жилья посуточно`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/apple-touch-icon.png", width: 180, height: 180 }],
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

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${inter.variable}`}>
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
