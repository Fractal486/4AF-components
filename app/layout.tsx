import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // The agent entry point: every page as Markdown, plus the install commands.
  alternates: { types: { "text/plain": "/llms.txt" } },
  title: "4AF — components",
  description: "Quiet, minimal React components with just enough motion, built on Base UI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <RootProvider theme={{ storageKey: "4af-theme" }} search={{ options: { type: "static" } }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
