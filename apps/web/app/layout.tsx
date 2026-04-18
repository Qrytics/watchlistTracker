/**
 * app/layout.tsx — Root Layout
 *
 * Applies global CSS, fonts, PWA meta tags, and the session provider.
 * All pages in the app inherit from this layout.
 */

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { SessionProvider } from "@/features/auth/SessionProvider";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "WatchlistTracker",
    template: "%s | WatchlistTracker",
  },
  description:
    "Track shows and movies you care about. Get alerted for new episodes, release dates, and nearby theater showings.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WatchList",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "WatchlistTracker",
    title: "WatchlistTracker",
    description: "Never miss a release. Track your shows and movies.",
  },
  icons: {
    shortcut: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SessionProvider>
          {children}
          <ServiceWorkerRegistrar />
        </SessionProvider>
      </body>
    </html>
  );
}
