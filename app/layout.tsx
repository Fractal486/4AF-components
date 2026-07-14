import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Toolbar } from "@/inspector/toolbar";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "4AF — components",
  description: "A component library, and an instrument for inspecting it.",
};

/**
 * Runs before first paint, so the page never renders in the wrong theme and then
 * snaps. It has to be inline and blocking — a React effect runs after paint, which
 * is exactly one frame too late and reads as a flash.
 */
const themeScript = `
(function () {
  try {
    var d = document.documentElement;
    var theme = localStorage.getItem("4af-theme");
    if (theme !== "light" && theme !== "dark") {
      theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    d.dataset.theme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The font variables go on <html>, not <body>. `@theme` emits `--font-sans:
    // var(--font-geist-sans), …` into `:root` — which *is* <html> — so if Geist's
    // variable is only defined a level down on <body>, the var() at :root has
    // nothing to resolve against, `--font-sans` becomes invalid, and every glyph
    // on the page silently falls back to the system UI font.
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6">
          <header className="flex h-14 shrink-0 items-center justify-between">
            <Link
              href="/"
              className="rounded-sm font-mono text-2xs tracking-widest text-foreground uppercase transition-[opacity] duration-(--duration-fast) ease-out hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              4AF / components
            </Link>
            <Toolbar />
          </header>
          <main className="flex-1 pb-24">{children}</main>
        </div>
      </body>
    </html>
  );
}
