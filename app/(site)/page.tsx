import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { GitHubMark } from "@/components/site/github-mark";
import { InlineLink } from "@/components/inline-link";
import { HeroBackdrop } from "@/components/landing/hero-backdrop";
import { CopyLine } from "@/components/landing/copy-line";
import { RevealGate } from "@/components/landing/reveal";
import { BaseUIMark, ReactMark } from "@/components/landing/title-marks";
import { REPOSITORY } from "@/lib/site-nav";
import { LLMS_TXT_URL, SKILL_INSTALL_COMMAND, pageAlternates } from "@/lib/site";
import { BlurText } from "@/registry/ui/blur-text/blur-text";
import { Button } from "@/registry/ui/button/button";

export const metadata: Metadata = {
  alternates: pageAlternates("/"),
};

/** Milliseconds between the title's letters (and logos), about BlurText's own 300ms spread. */
const TITLE_STAGGER = 8;

/**
 * The author and licence line, under the artwork: after its band on narrow screens, and at the
 * foot of the right half, centred under the field, where the artwork fills the hero.
 */
function Credit() {
  return (
    <p className="landing-reveal relative z-10 px-5 pb-10 text-sm text-subtle-foreground [--reveal-delay:450ms] sm:px-10 lg:absolute lg:bottom-8 lg:left-1/2 lg:w-1/2 lg:p-0 lg:text-center">
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
            {/* Three fixed lines at every width, so phones break it as desktop does. BlurText
                keeps the newlines; a no-break space keeps the name "Base UI" together. The
                runs share one stagger, offset so the letters and logos enter in reading order. */}
            <h1
              data-hero-copy="text"
              className="landing-title mb-7 text-[length:clamp(1.9rem,3.4vw,2.75rem)] leading-[1.12] font-semibold tracking-[-0.03em]"
            >
              <BlurText stagger={TITLE_STAGGER}>{"Minimal "}</BlurText>
              <ReactMark delay={7 * TITLE_STAGGER} />
              <BlurText stagger={TITLE_STAGGER} delay={8 * TITLE_STAGGER}>{"React\ncomponents built\non "}</BlurText>
              <BaseUIMark delay={30 * TITLE_STAGGER} />
              <BlurText stagger={TITLE_STAGGER} delay={31 * TITLE_STAGGER}>{"Base\u00a0UI."}</BlurText>
            </h1>
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
            </div>
            {/* The agents' entry point and the skill, as copyable lines. The URL is page text,
                so an agent given only the site's address finds it too. */}
            <div data-hero-copy className="landing-reveal mt-7 flex w-fit flex-col gap-3 [--reveal-delay:350ms]">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-subtle-foreground">
                  {/* Decorative: the text names it. `outline-none` drops the theme's image
                      outline, which would box in the transparent logo. Served at 4x and not
                      re-encoded: the optimiser would recompress so small an image soft. */}
                  <Image
                    src="/agents.png"
                    alt=""
                    width={365}
                    height={160}
                    unoptimized
                    className="h-3.5 w-auto outline-none"
                  />
                  For agents
                </p>
                <CopyLine value={LLMS_TXT_URL} />
              </div>
              <div>
                <p className="text-xs text-subtle-foreground">Install the agent skill</p>
                <CopyLine value={SKILL_INSTALL_COMMAND} />
              </div>
            </div>
          </div>
        </header>
        {/* The artwork is the whole hero's backdrop, its field centred in the right half and
            masked clear of the copy in the copy's own shape (`data-hero-copy`). */}
        <HeroBackdrop
          className="pointer-events-none relative -mt-12 lg:absolute lg:inset-0 lg:mt-0"
          artworkClassName="aspect-square sm:aspect-[16/10] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full lg:[--hero-center-x:75%] lg:[--hero-zoom:1.35]"
        />
        <Credit />
      </div>
    </>
  );
}
