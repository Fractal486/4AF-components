import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { highlightSource } from "@/components/landing/highlight-source";
import { Github } from "lucide-react";
import { DocsCodeBlock } from "@/components/docs-code-block";
import { InlineLink } from "@/components/inline-link";
import { AsciiFooter } from "@/components/landing/ascii-footer";
import { FileBrowser } from "@/components/landing/file-browser";
import { installedFiles } from "@/components/landing/install-files";
import { MobileToc } from "@/components/site/mobile-toc";
import { PageFrame } from "@/components/site/page-frame";
import { componentCount } from "@/lib/component-catalog";
import { REPOSITORY } from "@/lib/site-nav";
import { AGENT_PROMPT, pageAlternates, publicInstallCommand } from "@/lib/site";
import { cn } from "@/registry/lib/cn";
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
    rule: "Minimal by default",
    detail: "Compact controls, warm-neutral greys, and one amber accent kept for focus. Nothing is decorative.",
  },
  {
    rule: "Just enough motion",
    detail: "Animation marks a change: a press, a swap, a panel opening or closing. It is short, and it never makes you wait.",
  },
  {
    rule: "Quiet when asked",
    detail: "Every duration reads one token, so reduced motion turns the whole library down at once.",
  },
] as const;

const INSTALL = publicInstallCommand("button");

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
            priority
            unoptimized
            sizes="60vw"
            className="object-cover object-[60%_45%] outline-none [mask-image:radial-gradient(ellipse_62%_90%_at_64%_50%,black_55%,transparent),linear-gradient(to_right,transparent_26%,black_52%)] [mask-composite:intersect] invert hue-rotate-180 contrast-125 brightness-110 mix-blend-multiply dark:invert-0 dark:hue-rotate-0 dark:brightness-90 dark:mix-blend-screen"
          />
        </div>
        <div className="relative pb-4 lg:max-w-[30rem] lg:pt-20 lg:pb-4">
          <h1 className="mb-[1.1rem] text-[length:clamp(1.9rem,3.4vw,2.75rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-balance">
            Minimal React components built on Base UI.
          </h1>
          <p className="mb-6 max-w-[52ch] text-[17px] leading-[1.65] tracking-[-0.01em] text-pretty text-muted-foreground">
            4AF is a personal opinionated library of {componentCount} components; compact and
            warm-neutral, and animate only when and where needed.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/docs/reference/components">
                Browse components
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
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
          {/* Below lg the photo gets its own strip after the copy instead of sitting behind it,
              so the description and buttons stay near the top of a phone screen: full width,
              fading out at top and bottom, with the same blending. */}
          <div aria-hidden className="relative -mx-5 mt-4 aspect-[2/1] sm:-mx-10 lg:hidden">
            <Image
              src="/hero-architecture.webp"
              alt=""
              fill
              unoptimized
              sizes="100vw"
              className="object-cover object-[55%_45%] outline-none [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)] invert hue-rotate-180 contrast-125 brightness-110 mix-blend-multiply dark:invert-0 dark:hue-rotate-0 dark:brightness-90 dark:mix-blend-screen"
            />
          </div>
        </div>
      </header>
    <PageFrame toc={toc} mobileToc={false}>
        <article>

          <Section
            id="principles"
            title="Principles"
            // First in the frame: no rule or extra space above it, so its heading lines up with
            // the top of the "On this page" column beside it.
            className="mt-0 border-t-0 pt-0 sm:mt-0 sm:pt-0"
          >
            <dl className="mt-3 max-w-180 border-t">
              {PRINCIPLES.map(({ rule, detail }) => (
                <div key={rule} className="grid gap-1 border-b py-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="text-[15px] font-medium">{rule}</dt>
                  <dd className="text-[15px] leading-[1.6] text-muted-foreground">{detail}</dd>
                </div>
              ))}
            </dl>
            <p className={cn(PROSE, "mt-4")}>
              Underneath, behaviour comes from Base UI, state is exposed as{" "}
              <code className="font-mono text-sm">data-*</code> attributes, and every component
              works controlled or uncontrolled. The full rules are in{" "}
              <InlineLink href="/docs/reference/engineering">
                Engineering
              </InlineLink>
              .
            </p>
          </Section>

          <Section id="install" title="Install">
            <p className={PROSE}>
              Install any component with the shadcn CLI. The theme, the shared utilities, and the
              components it builds on come with it.
            </p>
            <DocsCodeBlock className="my-0 mt-3 max-w-180">
              <pre className="min-w-full w-max px-4 pr-14 font-mono text-xs leading-6">
                <code>{INSTALL}</code>
              </pre>
            </DocsCodeBlock>
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
              4AF is a personal library. I build it for my own projects and publish it as it
              grows. The logo was made in MS Paint.
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
      {/* Runs from the rail, like the hero (it cancels <main>'s left gutter), and ends with the
          content column: from xl that column leaves 11rem for "On this page" plus a 3rem gap. */}
      <AsciiFooter
        // Pulled up into the page frame's bottom padding (4rem, 7rem from sm).
        className="-mt-8 sm:-mt-16 lg:-ml-[clamp(2rem,4vw,4rem)] xl:mr-56"
      />
    </>
  );
}
