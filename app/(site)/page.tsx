import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { GitHubMark } from "@/components/site/github-mark";
import { InlineLink } from "@/components/inline-link";
import { AsciiFooter } from "@/components/landing/ascii-footer";
import { HeroComponentPreview } from "@/components/landing/hero-component-preview";
import { InstallCommand } from "@/components/landing/install-command";
import { RevealGate } from "@/components/landing/reveal";
import { ArticleColumn } from "@/components/site/article-column";
import { PageFrame } from "@/components/site/page-frame";
import { componentCount, registryComponents } from "@/lib/component-catalog";
import { REPOSITORY } from "@/lib/site-nav";
import { AGENT_PROMPT, SKILL_INSTALL_COMMAND, pageAlternates } from "@/lib/site";
import { DocsCodeBlock } from "@/components/docs-code-block";
import { cn } from "@/registry/lib/cn";
import { BlurText } from "@/registry/ui/blur-text/blur-text";
import { Button } from "@/registry/ui/button/button";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";

export const metadata: Metadata = {
  alternates: pageAlternates("/"),
};

const PRINCIPLES = [
  {
    rule: "Neutral & one accent",
    href: "/docs/reference/design",
    detail: "Warm-neutral greys and compact controls. Blue appears only on focus rings.",
  },
  {
    rule: "Motion w/ purpose",
    href: "/docs/reference/engineering#motion-contract",
    detail: "Motion only where it feels good, not where it's decoration. Reduced motion switches it off, except for spinners.",
  },
  {
    rule: "One contract",
    href: "/docs/reference/engineering#component-contract",
    detail: "Every component is rebuilt to the same rules: Base UI for behaviour, semantic tokens for styling, state exposed as data-* attributes, forwarded props and refs, and controlled or uncontrolled use.",
  },
] as const;

// Every installable component, starting with the button.
const INSTALL_NAMES = [
  "button",
  ...registryComponents.map(({ name }) => name).filter((name) => name !== "button"),
];

const PROSE = "max-w-180 text-[16px] leading-[1.65] text-pretty text-muted-foreground";

function Section({
  id,
  title,
  className,
  children,
}: {
  id: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      // Clears the sticky top bar below lg; the rail sits beside the content above it.
      className={cn("mt-10 scroll-mt-28 border-t pt-7 sm:mt-13 sm:pt-9 lg:scroll-mt-14 xl:scroll-mt-0", className)}
    >
      <h2 id={`${id}-title`} className="mb-4 text-xl font-semibold tracking-[-0.015em] sm:text-[22px]">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export default function IndexPage() {
  return (
    // Wider than a reference page's column, so the hero's artwork band fits inside it.
    <ArticleColumn className="max-w-[68rem]">
      <RevealGate />
      {/* Without JavaScript the gate never opens, so run the entrance straight away. */}
      <noscript>
        <style>{".landing-reveal,.landing-title .animate-blur-text-in,[data-hero-entrance] [data-preview-panel]{animation-play-state:running}"}</style>
      </noscript>
      {/* The copy, the artwork as a wide band across the column, then the actions over its faded
          lower edge. Narrow screens run the band out to the screen's edges. */}
      <header className="relative isolate flex flex-col px-5 pt-8 sm:px-10 sm:pt-12 lg:px-0 lg:pt-16">
        <div className="relative z-10 max-w-[40rem]">
          {/* A no-break space keeps the name "Base UI" on one line. */}
          <BlurText
            as="h1"
            className="landing-title mb-[1.1rem] text-[length:clamp(1.9rem,3.4vw,2.75rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-balance"
          >
            {"Minimal React components built on Base\u00a0UI."}
          </BlurText>
          <p className="landing-reveal mb-6 max-w-[52ch] text-[17px] [--reveal-delay:250ms] leading-[1.65] tracking-[-0.01em] text-pretty text-subtle-foreground">
            4AF is a personal library of {componentCount} components with compact sizing, a
            warm-neutral palette, and short animations on state changes.
          </p>
        </div>
        <div className="pointer-events-none relative z-0 -mx-5 -mt-3 sm:-mx-10 lg:mx-0 lg:-mt-6 lg:w-[720px]">
          <HeroComponentPreview entrance className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2/1]" />
        </div>
        {/* Below the artwork, overlapping its faded lower edge a little. */}
        <div className="landing-reveal relative z-10 -mt-2 [--reveal-delay:400ms] lg:-mt-3">
          {/* Natural widths, a notch smaller on phones so both fit on one row. */}
          <div className="flex flex-wrap items-center gap-3">
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
          <CopyButton
            value={AGENT_PROMPT}
            size="md"
            variant="plain"
            iconPosition="end"
            swapLabel={false}
            // Secondary to the two buttons above, and flush with their left edge.
            className="mt-3 px-0 text-muted-foreground hover:text-foreground"
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
      </header>
    {/* The content enters last. No "On this page": three short sections need no contents. */}
    <div className="landing-reveal [--reveal-delay:500ms]">
    <PageFrame
      toc={[]}
      footer={
        // Starts with the content column, like the hero above it, so its left fade begins there.
        <AsciiFooter
          // Pulled up into the content column's bottom padding (4rem, 7rem from sm).
          className="-mt-8 sm:-mt-16"
        />
      }
    >
        <article>

          <Section
            id="principles"
            title="Principles"
            // First in the frame: no rule or extra space above it.
            className="mt-0 border-t-0 pt-0 sm:mt-0 sm:pt-0"
          >
            <dl className="mt-3 max-w-180 border-t">
              {PRINCIPLES.map(({ rule, href, detail }) => (
                <div key={rule} className="grid gap-1 border-b py-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="text-[15px] font-medium">
                    {/* InlineLink sets a normal weight; the label keeps the term's medium one. */}
                    <InlineLink href={href} className="font-medium">
                      {rule}
                    </InlineLink>
                  </dt>
                  <dd className="text-[15px] leading-[1.6] text-muted-foreground">{detail}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="install" title="Install" className="border-t-0">
            <p className={PROSE}>
              Install any component with the shadcn CLI. The theme, the shared utilities, and the
              components it builds on come with it.
            </p>
            <InstallCommand names={INSTALL_NAMES} />
            <p className={cn(PROSE, "mt-4")}>
              Coding agents can start at{" "}
              <InlineLink href="/llms.txt">
                /llms.txt
              </InlineLink>
              , which has these commands and links component docs and reference sections as Markdown. The{" "}
              <InlineLink href="/docs/reference/agent-skill">
                agent skill
              </InlineLink>{" "}
              packages the same workflow for them:
            </p>
            <div className="mt-3 max-w-180">
              <DocsCodeBlock className="my-0">
                <pre className="min-w-full w-max px-4 pr-14 font-mono text-xs leading-6">
                  <code>{SKILL_INSTALL_COMMAND}</code>
                </pre>
              </DocsCodeBlock>
            </div>
            <p className={cn(PROSE, "mt-4")}>
              Add <code className="font-mono text-sm">--dry-run</code> to preview files,
              dependencies, and CSS updates. Short names, browsing the catalog, and updating are covered in{" "}
              <InlineLink href="/docs/reference/installation">
                Installation
              </InlineLink>
              .
            </p>
          </Section>

          <Section id="about" title="About">
            <p className={PROSE}>
              4AF is a personal library by{" "}
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
              . I build it for my own projects and publish it as it grows. The logo was made in
              MS Paint.
            </p>
            <p className={PROSE}>
              Original work is released under MIT-0, so you can copy it without attribution. Some
              components include code under other licences; see the{" "}
              <InlineLink href={`${REPOSITORY}/blob/main/THIRD_PARTY_NOTICES.md`} external={false}>
                licence notices
              </InlineLink>
              .
            </p>
          </Section>
        </article>
    </PageFrame>
    </div>
    </ArticleColumn>
  );
}
