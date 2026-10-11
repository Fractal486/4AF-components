import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { highlight } from "fumadocs-core/highlight";
import { Github } from "lucide-react";
import { FileBrowser } from "@/components/landing/file-browser";
import { installedFiles } from "@/components/landing/install-files";
import { SpecimenBoard } from "@/components/landing/specimen-board";
import { PageFrame } from "@/components/site/page-frame";
import { componentCount } from "@/lib/component-catalog";
import { REPOSITORY } from "@/lib/site-nav";
import { publicInstallCommand } from "@/lib/site";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";

const SECTIONS = [
  { id: "components", title: "Components" },
  { id: "contract", title: "The contract" },
  { id: "install", title: "Install" },
  { id: "about", title: "About" },
] as const;

const CONTRACT = [
  {
    rule: "Behaviour from Base UI",
    detail: "Base UI supplies focus, dismissal and keyboard navigation. Calendar uses react-day-picker.",
  },
  {
    rule: "State on the element",
    detail: "data-* attributes expose what a component is doing, so styles and tests read the DOM rather than props.",
  },
  {
    rule: "Prefer compositor-friendly motion",
    detail: "Animations favor transform, opacity, filter and clip-path. Collapsible and Sidebar have documented layout-motion exceptions.",
  },
  {
    rule: "Durations from tokens",
    detail: "CSS transitions use duration tokens; JavaScript animations respect reduced motion separately.",
  },
  {
    rule: "Controlled or uncontrolled",
    detail: "Interactive components support controlled and uncontrolled state through their value, checked, pressed or open APIs.",
  },
  {
    rule: "Lists open ready",
    detail: "Selects, menus and the command palette open with a row already highlighted, so Enter works straight away.",
  },
] as const;

const INSTALL = publicInstallCommand("button");

const PROSE = "max-w-180 text-[16px] leading-[1.65] text-pretty text-muted-foreground";
const INLINE_LINK =
  "rounded-xs text-foreground underline decoration-border-strong underline-offset-[3px] outline-none transition-[text-decoration-color] duration-(--duration-fast) hover:decoration-current focus-visible:ring-2 focus-visible:ring-ring";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      // Clears the sticky top bar below lg; the rail sits beside the content above it.
      className="mt-10 scroll-mt-14 border-t pt-7 sm:mt-13 sm:pt-9 lg:scroll-mt-0"
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
      code: await highlight(code, {
        lang,
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
        components: {
          // With `defaultColor: false` the inline style only carries Shiki's colour variables.
          pre: ({ className, ...props }) => (
            <pre {...props} className={cn(className, "min-w-max py-4 font-mono text-xs leading-5")} />
          ),
        },
      }),
    })),
  );
}

export default async function IndexPage() {
  const files = await installFiles();

  return (
    <PageFrame
      toc={SECTIONS.map(({ id, title }, index) => ({
        id,
        title: (
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-2xs tabular">{String(index + 1).padStart(2, "0")}</span>
            {title}
          </span>
        ),
      }))}
    >
        <article>
          <header className="max-w-180">
            <h1 className="mb-[1.1rem] text-[length:clamp(1.9rem,3.4vw,2.75rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-balance">
              React components, built to one contract.
            </h1>
            <p className="mb-6 max-w-[52ch] text-[17px] leading-[1.65] tracking-[-0.01em] text-pretty text-muted-foreground">
              4AF is a personal library of {componentCount} React components built on Base UI.
              They share theme tokens, motion conventions and keyboard interaction patterns.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/docs/reference/components">
                  Browse components
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={REPOSITORY}>
                  <Github aria-hidden="true" />
                  View on GitHub
                </a>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Using a coding agent? Point it at the{" "}
              <Link href="/docs/reference/agent-skill" className={INLINE_LINK}>
                agent skill
              </Link>
              .
            </p>
          </header>

          <Section id="components" title="Components">
            <Wide>
              <SpecimenBoard />
            </Wide>
          </Section>

          <Section id="contract" title="The contract">
            <p className={PROSE}>
              The library follows these conventions.
            </p>
            <dl className="mt-3 max-w-180 border-t">
              {CONTRACT.map(({ rule, detail }) => (
                <div key={rule} className="grid gap-1 border-b py-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="text-[15px] font-medium">{rule}</dt>
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
            <div className="relative mt-3 max-w-180 rounded-lg border bg-surface">
              <pre className="overflow-x-auto p-4 pr-14 font-mono text-xs leading-6">
                <code>{INSTALL}</code>
              </pre>
              <CopyButton
                value={INSTALL}
                variant="ghost"
                size="xs"
                aria-label="Copy install command"
                className="absolute top-2.5 right-2.5"
              />
            </div>
            <p className={cn(PROSE, "mt-4")}>Installing the button writes these files:</p>
            <Wide className="mt-0">
              <FileBrowser files={files} />
            </Wide>
            <p className={cn(PROSE, "mt-4")}>
              From a clone of the repository, the 4AF CLI also checks that your project is ready,
              previews every file before writing, and never overwrites a file unless told to. See
              the{" "}
              <Link href="/docs/reference/cli" className={INLINE_LINK}>
                CLI reference
              </Link>
              . Coding agents can use either path through the{" "}
              <Link href="/docs/reference/agent-skill" className={INLINE_LINK}>
                agent skill
              </Link>
              .
            </p>
          </Section>

          <Section id="about" title="About">
            <p className={PROSE}>
              4AF is a personal library. I build it for my own projects and publish it as it
              grows.
            </p>
            <p className={PROSE}>
              Original work is released under MIT-0, so you can copy it without attribution. Some
              components include code under other licences; see the{" "}
              <a href={`${REPOSITORY}/blob/main/THIRD_PARTY_NOTICES.md`} className={INLINE_LINK}>
                licence notices
              </a>
              .
            </p>
          </Section>
        </article>
    </PageFrame>
  );
}
