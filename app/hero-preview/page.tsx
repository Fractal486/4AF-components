import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { HeroComponentPreview } from "@/components/landing/hero-component-preview";

export const metadata: Metadata = {
  title: "Hero preview — 4AF",
  description: "A perspective study of the 4AF components, with the command palette at its center.",
  robots: { index: false, follow: false },
};

export default function HeroPreviewPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-5 py-6 sm:px-10 sm:py-8">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="size-3.5" />Back to the library
        </Link>
        <ThemeSwitch />
      </header>
      <div className="mt-12 sm:mt-16">
        <h1 className="text-xl font-medium tracking-tight">Hero preview</h1>
        <p className="mt-2 text-sm text-muted-foreground">A small collection, with the command palette at the center.</p>
      </div>
      <HeroComponentPreview className="my-auto" />
    </main>
  );
}
