import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { GitHubMark } from "@/components/site/github-mark";
import { InlineLink } from "@/components/inline-link";
import { HeroBackdrop } from "@/components/landing/hero-backdrop";
import { CopyLine } from "@/components/landing/copy-line";
import { InstallCommand } from "@/components/landing/install-command";
import { RevealGate } from "@/components/landing/reveal";
import { registryComponents } from "@/lib/component-catalog";
import { REPOSITORY } from "@/lib/site-nav";
import { AGENT_PROMPT, SKILL_INSTALL_COMMAND, pageAlternates } from "@/lib/site";
import { BlurText } from "@/registry/ui/blur-text/blur-text";
import { Button } from "@/registry/ui/button/button";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";

export const metadata: Metadata = {
  alternates: pageAlternates("/"),
};

// Every installable component, starting with the button.
const INSTALL_NAMES = [
  "button",
  ...registryComponents.map(({ name }) => name).filter((name) => name !== "button"),
];

/** The author and licence line. */
function Credit() {
  return (
    <p data-hero-copy className="landing-reveal mt-6 w-fit text-sm text-subtle-foreground [--reveal-delay:450ms]">
    By{" "}
    <InlineLink href="https://selfsimilar.dev">
      {/* Decorative: the label names the link. Served at 4x its 20px size. */}
      <Image
        src="/fractal.webp"
        alt=""
        width={80}
        height={80}
        unoptimized
        className="mr-1 inline-block size-5 align-[-0.3em] outline-none"
      />
      Fractal
    </InlineLink>
    {" · MIT-0, some parts under "}
    <InlineLink href={`${REPOSITORY}/blob/main/THIRD_PARTY_NOTICES.md`} external={false}>
      other licences
    </InlineLink>
    </p>
  );
}

export default function IndexPage() {
  return (
    <>
      <RevealGate />
      {/* Without JavaScript the gate never opens, so run the entrance straight away. */}
      <noscript>
        <style>{".landing-reveal,.landing-title .animate-blur-text-in,[data-hero-entrance] [data-preview-panel]{animation-play-state:running}"}</style>
      </noscript>
      {/* One screen: the copy at the left, centred top to bottom, and the artwork filling the
          right half. Narrow screens stack them, the artwork as a band under the copy. */}
      <div data-hero className="relative lg:grid lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <header className="relative z-10 flex flex-col justify-center px-5 pt-10 sm:px-10 sm:pt-14 lg:py-16 lg:pr-0 lg:pl-[clamp(2rem,4vw,4rem)]">
          <div className="max-w-[34rem]">
            {/* A no-break space keeps the name "Base UI" on one line. */}
            <BlurText
              as="h1"
              data-hero-copy="text"
              className="landing-title mb-7 text-[length:clamp(1.9rem,3.4vw,2.75rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-balance"
            >
              {"Minimal React components built on Base\u00a0UI."}
            </BlurText>
            {/* Natural widths, a notch smaller on phones so the row fits. */}
            <div data-hero-copy className="landing-reveal flex w-fit flex-wrap items-center gap-x-3 gap-y-2 [--reveal-delay:250ms]">
              <Button asChild size="lg" className="px-3 text-xs min-[360px]:px-4 min-[360px]:text-sm sm:px-5 sm:text-base">
                <Link href="/docs/reference/components">
                  Browse components
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-background px-3 text-xs min-[360px]:px-4 min-[360px]:text-sm sm:gap-3 sm:px-5 sm:text-base">
                <a href={REPOSITORY} target="_blank" rel="noopener noreferrer">
                  <GitHubMark />
                  View on GitHub
                </a>
              </Button>
              <CopyButton
                value={AGENT_PROMPT}
                size="md"
                variant="plain"
                iconPosition="end"
                swapLabel={false}
                className="px-1 text-muted-foreground hover:text-foreground"
              >
                <span className="inline-flex items-center gap-2.5">
                  {/* Decorative: the label names the button. `outline-none` drops the
                      theme's image outline, which would box in the transparent logo. */}
                  {/* Served at 4x the 20px display height and not re-encoded: the optimiser
                      picks a small width for a 45px image and recompresses it soft. */}
                  <Image
                    src="/agents.png"
                    alt=""
                    width={365}
                    height={160}
                    unoptimized
                    className="h-5 w-auto outline-none"
                  />
                  Agent prompt
                </span>
              </CopyButton>
            </div>
            {/* The component install, cycling through the catalog, and the agent skill. */}
            <div data-hero-copy className="landing-reveal mt-7 flex w-fit flex-col gap-3 [--reveal-delay:350ms]">
              <div>
                <p className="text-xs text-subtle-foreground">Install a component</p>
                <InstallCommand names={INSTALL_NAMES} />
              </div>
              <div>
                <p className="text-xs text-subtle-foreground">Install the agent skill</p>
                <CopyLine value={SKILL_INSTALL_COMMAND} />
              </div>
            </div>
            <Credit />
          </div>
        </header>
        {/* The artwork is the whole hero's backdrop, its field centred in the right half and
            masked clear of the copy in the copy's own shape (`data-hero-copy`). */}
        <HeroBackdrop
          className="pointer-events-none relative mt-6 lg:absolute lg:inset-0 lg:mt-0"
          artworkClassName="aspect-square sm:aspect-[16/10] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full lg:[--hero-center-x:75%] lg:[--hero-zoom:1.35]"
        />
      </div>
    </>
  );
}
