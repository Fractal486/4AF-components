import Link from "next/link";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { SpecimenBoard } from "@/components/landing/specimen-board";
import { componentCount } from "@/lib/component-catalog";
import { Button } from "@/registry/ui/button/button";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";

const REPOSITORY = "https://github.com/Fractal486/4AF-components";

const CONTRACT = [
  {
    rule: "Behaviour from Base UI",
    detail: "Focus traps, dismissal and keyboard navigation come from one primitive layer, never hand-rolled copies.",
  },
  {
    rule: "State on the element",
    detail: "data-* attributes carry what a component is doing, so styles and tests read the DOM instead of props.",
  },
  {
    rule: "Motion on the compositor",
    detail: "Only transform, opacity, filter and clip-path animate. Nothing relayouts mid-frame.",
  },
  {
    rule: "Durations from tokens",
    detail: "Every transition reads a --duration-* token, so reduced motion reaches every component at once.",
  },
  {
    rule: "Controlled or uncontrolled",
    detail: "value, defaultValue and onValueChange work the same way across the library.",
  },
  {
    rule: "Lists open ready",
    detail: "Selects, menus and the command palette open with a row marked, so Enter always has an answer.",
  },
] as const;

const INSTALL = [
  `git clone ${REPOSITORY}.git`,
  "cd 4AF-components && pnpm install",
  "pnpm 4af doctor --project /path/to/your-app",
  "pnpm 4af install button --project /path/to/your-app",
].join("\n");

export default function IndexPage() {
  return (
    <HomeLayout
      githubUrl={REPOSITORY}
      nav={{ title: "4AF Components" }}
      links={[{ text: "Components", url: "/docs" }]}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
        <section className="flex flex-col gap-12">
          <div className="flex max-w-3xl flex-col gap-6">
            <p className="font-mono text-2xs text-muted-foreground">
              {componentCount} components · Base UI · MIT-0
            </p>
            <h1 className="text-[length:clamp(2.5rem,7vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
              Interface parts, rebuilt to one contract.
            </h1>
            <p className="max-w-xl text-base text-pretty text-muted-foreground">
              React components taken from public libraries and rewritten until they share the
              same tokens, motion and keyboard behaviour. Install only the ones you need.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/docs">Browse components</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={REPOSITORY}>View source</a>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <SpecimenBoard />
            <p className="font-mono text-2xs text-subtle-foreground">
              Every component above is live. The line under each one is the state it carries on
              the DOM, read as it changes.
            </p>
          </div>
        </section>

        <section aria-labelledby="contract" className="flex flex-col gap-10">
          <div className="flex max-w-xl flex-col gap-3">
            <h2 id="contract" className="text-2xl font-semibold">
              The contract
            </h2>
            <p className="text-base text-muted-foreground">
              A component meets every line of it, or it isn&apos;t in the library.
            </p>
          </div>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {CONTRACT.map(({ rule, detail }) => (
              <div key={rule} className="flex flex-col gap-1.5 border-t pt-4">
                <dt className="font-medium">{rule}</dt>
                <dd className="text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-labelledby="install"
          className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16"
        >
          <div className="flex flex-col gap-3">
            <h2 id="install" className="text-2xl font-semibold">
              Install into your project
            </h2>
            <p className="text-base text-muted-foreground">
              The 4AF CLI serves components from this repository. It checks that your project
              has a shadcn <code className="font-mono text-sm">components.json</code>, then
              writes the component, the utilities it needs and the theme.
            </p>
            <p className="text-base text-muted-foreground">
              Coding agents can use the{" "}
              <Link href="/docs/reference/agent-skill" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-current">
                agent skill
              </Link>{" "}
              instead. Every flag is in the{" "}
              <Link href="/docs/reference/cli" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-current">
                CLI reference
              </Link>
              .
            </p>
          </div>
          <div className="relative rounded-xl bg-surface shadow-border">
            <pre className="overflow-x-auto p-5 pr-16 font-mono text-xs leading-6">
              <code>{INSTALL}</code>
            </pre>
            <CopyButton
              value={INSTALL}
              variant="ghost"
              aria-label="Copy install commands"
              className="absolute top-3 right-3"
            />
          </div>
        </section>
      </div>

      <footer className="mt-auto border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-x-6 gap-y-2 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <p>Original work released under MIT-0.</p>
          <p>
            Adapted in part from Animate UI, beUI, basecn, HextaUI and loading.dev.{" "}
            <a
              href={`${REPOSITORY}/blob/main/THIRD_PARTY_NOTICES.md`}
              className="text-foreground underline decoration-border underline-offset-4 hover:decoration-current"
            >
              Notices
            </a>
          </p>
        </div>
      </footer>
    </HomeLayout>
  );
}
