import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteProviders } from "@/components/site/providers";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // The agent entry point: every page as Markdown, plus the install commands.
  alternates: { types: { "text/plain": "/llms.txt" } },
  title: "4AF — components",
  description: "Quiet, minimal React components with just enough motion, built on Base UI.",
  // The image itself is `app/opengraph-image.png`; this asks X for the large card.
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <SiteProviders>
          {children}
        </SiteProviders>
      </body>
    </html>
  );
}
