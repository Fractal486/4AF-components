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
    detail: "Focus, dismissal and keyboard navigation come from Base UI, not hand-written copies.",
  },
  {
    rule: "State on the element",
    detail: "data-* attributes expose what a component is doing, so styles and tests read the DOM rather than props.",
  },
  {
    rule: "Motion on the compositor",
    detail: "Animations use transform, opacity, filter and clip-path, which skip layout. The one exception is a collapsible panel's height.",
  },
  {
    rule: "Durations from tokens",
    detail: "Every transition reads a --duration-* token, so reduced motion shortens all of them at once.",
  },
  {
    rule: "Controlled or uncontrolled",
    detail: "value, defaultValue and onValueChange work the same way in every component.",
  },
  {
    rule: "Lists open ready",
    detail: "Selects, menus and the command palette open with a row already highlighted, so Enter works straight away.",
  },
] as const;

const INSTALL = [
  `git clone ${REPOSITORY}.git`,
  "cd 4AF-components && pnpm install",
  "pnpm 4af doctor --project /path/to/your-app",
  "pnpm 4af install button --project /path/to/your-app",
].join("\n");

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
              React components, built to one contract.{" "}
              <span className="text-subtle-foreground">Installed by you or your agent.</span>
            </h1>
            <p className="mb-6 max-w-[52ch] text-[17px] leading-[1.65] tracking-[-0.01em] text-pretty text-muted-foreground">
              4AF is a personal library of {componentCount} React components built on Base UI.
              They share one set of tokens, one motion system and the same keyboard behaviour.
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
              Every component in the library meets all six rules.
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
              The 4AF CLI serves components straight from this repository. It checks that your
              project is set up, can preview every file before writing, and installs the component
              together with the utilities and theme it needs.
            </p>
            <div className="relative mt-3 max-w-180 rounded-lg border bg-surface">
              <pre className="overflow-x-auto p-4 pr-14 font-mono text-xs leading-6">
                <code>{INSTALL}</code>
              </pre>
              <CopyButton
                value={INSTALL}
                variant="ghost"
                size="xs"
                aria-label="Copy install commands"
                className="absolute top-2.5 right-2.5"
              />
            </div>
            <p className={cn(PROSE, "mt-4")}>Installing the button writes these files:</p>
            <Wide className="mt-0">
              <FileBrowser files={files} />
            </Wide>
            <p className={cn(PROSE, "mt-4")}>
              Coding agents run the same CLI through the{" "}
              <Link href="/docs/reference/agent-skill" className={INLINE_LINK}>
                agent skill
              </Link>
              , which also covers choosing components and checking a project first. Every flag is
              listed in the{" "}
              <Link href="/docs/reference/cli" className={INLINE_LINK}>
                CLI reference
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
