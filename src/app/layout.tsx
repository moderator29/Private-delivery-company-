import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { BRAND } from "@/lib/brand";
import { absoluteUrl, env } from "@/lib/env";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${BRAND.name} | ${BRAND.descriptor}`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "SwiftTrack is a private delivery company for United States shipments, with a tracking record that shows exactly where a package has been scanned.",
  applicationName: BRAND.name,
  keywords: [
    "private delivery company",
    "shipment tracking",
    "package tracking",
    "courier service",
    "SwiftTrack",
  ],
  authors: [{ name: BRAND.legalName }],
  openGraph: {
    type: "website",
    siteName: BRAND.legalName,
    url: absoluteUrl("/"),
    title: `${BRAND.name} | ${BRAND.descriptor}`,
    description:
      "Track a SwiftTrack shipment and see every scan on its route, with clear delivery estimates.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} | ${BRAND.descriptor}`,
    description: "Private delivery, tracked end to end.",
  },
  alternates: {
    canonical: absoluteUrl("/"),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-white antialiased">
        {/* First tab stop on every page, so keyboard users can bypass the nav. */}
        <a
          href="#main"
          className="sr-only-focusable absolute top-3 left-3 z-50 rounded-control bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
