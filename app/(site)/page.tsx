import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { highlightSource } from "@/components/landing/highlight-source";
import { Github } from "lucide-react";
import { InlineLink } from "@/components/inline-link";
import { AsciiFooter } from "@/components/landing/ascii-footer";
import { FileBrowser } from "@/components/landing/file-browser";
import { InstallCommand } from "@/components/landing/install-command";
import { RevealGate } from "@/components/landing/reveal";
import { installedFiles } from "@/components/landing/install-files";
import { MobileToc } from "@/components/site/mobile-toc";
import { PageFrame } from "@/components/site/page-frame";
import { componentCount, registryComponents } from "@/lib/component-catalog";
import { REPOSITORY } from "@/lib/site-nav";
import { AGENT_PROMPT, pageAlternates } from "@/lib/site";
import { cn } from "@/registry/lib/cn";
import { BlurText } from "@/registry/ui/blur-text/blur-text";
import { Button } from "@/registry/ui/button/button";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";

export const metadata: Metadata = {
  alternates: pageAlternates("/"),
};

const SECTIONS = [
  { id: "principles", title: "Principles" },
  { id: "install", title: "Install" },
  { id: "about", title: "About" },
] as const;

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

// Every installable component, starting with the button whose files are shown below.
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

/** A figure allowed to run wider than the reading column. */
function Wide({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-3 max-w-225", className)} {...props} />;
}

async function installFiles() {
  const files = await installedFiles("button");
  return Promise.all(
    files.map(async ({ path, code, lang }) => ({
      path,
      lines: code.trimEnd().split("\n").length,
      // Highlight once at build time and keep the inert tokens out of React hydration.
      code: <div dangerouslySetInnerHTML={{ __html: await highlightSource(code, lang) }} />,
    })),
  );
}

export default async function IndexPage() {
  const files = await installFiles();

  const toc = SECTIONS.map(({ id, title }, index) => ({
        id,
        title: (
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-2xs tabular">{String(index + 1).padStart(2, "0")}</span>
            {title}
          </span>
        ),
      }));

  return (
    <>
      {/* The narrow-screen "On this page" bar, directly under the top bar rather than after
          the hero, which sits outside the page frame. */}
      <RevealGate />
      {/* Without JavaScript the gate never opens, so run the entrance straight away. */}
      <noscript>
        <style>{".landing-reveal,.landing-reveal-fade,.landing-title .animate-blur-text-in{animation-play-state:running}"}</style>
      </noscript>
      <MobileToc items={toc} />
      {/* Copy on the page background at the left; the photograph is a layer behind the whole
          hero, running off the right edge of the main area, and fades out under the copy. The
          photo has no container. An oval mask
          dissolves its edges, and blending drops its sky into the page in either theme: as
          shot with `screen` in dark mode (the black disappears), inverted with `multiply` in
          light mode (the white disappears); the half-turn of hue after inverting keeps the
          colours as shot. The contrast
          push takes the sky to pure black or white, so no faint rectangle is left behind. */}
      <header className="relative px-5 pt-8 sm:px-10 sm:pt-12 lg:-mr-[clamp(2rem,4vw,4rem)] lg:px-0 lg:pt-0">
        <div className="absolute inset-0 hidden lg:block">
          <Image
            src="/hero-architecture.webp"
            alt=""
            fill
            // Either copy of the photo can be the LCP, depending on the viewport, so both load
            // eagerly at high priority rather than one being preloaded. They share one URL, so
            // the file is still fetched once.
            loading="eager"
            fetchPriority="high"
            unoptimized
            sizes="60vw"
            className="landing-reveal-fade object-cover object-[60%_45%] outline-none [--reveal-delay:300ms] [mask-image:radial-gradient(ellipse_62%_90%_at_64%_50%,black_55%,transparent),linear-gradient(to_right,transparent_26%,black_52%)] [mask-composite:intersect] invert hue-rotate-180 contrast-125 brightness-110 mix-blend-multiply dark:invert-0 dark:hue-rotate-0 dark:brightness-90 dark:mix-blend-screen"
          />
        </div>
        <div className="relative pb-4 lg:max-w-[30rem] lg:pt-20 lg:pb-4">
          {/* A no-break space keeps the name "Base UI" on one line. */}
          <BlurText
            as="h1"
            className="landing-title mb-[1.1rem] text-[length:clamp(1.9rem,3.4vw,2.75rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-balance"
          >
            {"Minimal React components built on Base\u00a0UI."}
          </BlurText>
          <p className="landing-reveal mb-6 max-w-[52ch] text-[17px] [--reveal-delay:250ms] leading-[1.65] tracking-[-0.01em] text-pretty text-muted-foreground">
            4AF is a personal library of {componentCount} components with compact sizing, a
            warm-neutral palette, and short animations on state changes.
          </p>
          {/* Below lg the photo follows the description. The actions overlap its lower edge. */}
          <div aria-hidden className="relative -mx-5 aspect-[2/1] sm:-mx-10 lg:hidden">
            <Image
              src="/hero-architecture.webp"
              alt=""
              fill
              loading="eager"
              fetchPriority="high"
              unoptimized
              sizes="100vw"
              className="landing-reveal-fade object-cover object-[55%_45%] outline-none [--reveal-delay:350ms] [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)] invert hue-rotate-180 contrast-125 brightness-110 mix-blend-multiply dark:invert-0 dark:hue-rotate-0 dark:brightness-90 dark:mix-blend-screen"
            />
          </div>
          <div className="landing-reveal relative -mt-6 [--reveal-delay:400ms] lg:mt-0">
            {/* Natural widths, a notch smaller on phones so both fit on one row. */}
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="px-3 text-xs min-[360px]:px-4 min-[360px]:text-sm sm:px-5 sm:text-base">
                <Link href="/docs/reference/components">
                  Browse components
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 px-3 text-xs min-[360px]:px-4 min-[360px]:text-sm sm:gap-3 sm:px-5 sm:text-base">
                <a href={REPOSITORY} target="_blank" rel="noopener noreferrer">
                  <Github aria-hidden="true" />
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

        </div>
      </header>
    {/* The content and its "On this page" rail enter together, last. */}
    <div className="landing-reveal [--reveal-delay:500ms]">
    <PageFrame
      toc={toc}
      mobileToc={false}
      footer={
        // Runs from the rail, like the hero (it cancels <main>'s left gutter), and ends with
        // the content column, beside "On this page", which stays pinned next to it.
        <AsciiFooter
          // Pulled up into the content column's bottom padding (4rem, 7rem from sm).
          className="-mt-8 sm:-mt-16 lg:-ml-[clamp(2rem,4vw,4rem)]"
        />
      }
    >
        <article>

          <Section
            id="principles"
            title="Principles"
            // First in the frame: no rule or extra space above it, so its heading lines up with
            // the top of the "On this page" column beside it.
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

          <Section id="install" title="Install">
            <p className={PROSE}>
              Install any component with the shadcn CLI. The theme, the shared utilities, and the
              components it builds on come with it.
            </p>
            <InstallCommand names={INSTALL_NAMES} />
            <p className={cn(PROSE, "mt-4")}>Installing the button writes these files:</p>
            <Wide className="mt-0">
              <FileBrowser files={files} />
            </Wide>
            <p className={cn(PROSE, "mt-4")}>
              Add <code className="font-mono text-sm">--dry-run</code> to see every change before
              anything is written. Short names, browsing the catalog, and updating are covered in{" "}
              <InlineLink href="/docs/reference/installation">
                Installation
              </InlineLink>
              .
            </p>
            <p className={cn(PROSE, "mt-4")}>
              Coding agents can start at{" "}
              <InlineLink href="/llms.txt">
                /llms.txt
              </InlineLink>
              , which has these commands and links every page as Markdown.
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
    </>
  );
}
