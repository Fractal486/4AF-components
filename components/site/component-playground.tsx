"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Link as LinkIcon, Maximize2, Minimize2, RotateCcw, Terminal } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { MobileToc } from "@/components/site/mobile-toc";
import { Controls } from "@/inspector/controls";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { TableOfContents, type TocItem } from "@/registry/ui/table-of-contents/table-of-contents";
import { Tabs, TabsList, TabsTab } from "@/registry/ui/tabs/tabs";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";
import {
  DemoCanvas,
  DemoSettings,
  hasDemoSettings,
  useComponentDemo,
} from "@/stories/component-demo";
import type { PlaygroundDemo } from "@/stories/demo-names";

/**
 * The view lives in the URL hash: none is the preview, `#docs` the documentation, and any
 * other hash a heading inside it. A search result or shared link to a section therefore opens
 * the docs at that section, and Back returns to the preview.
 */
const DOCS_HASH = "docs";
const hashListeners = new Set<() => void>();

function subscribeToHash(listener: () => void) {
  // Next navigates with `pushState`, which fires neither window event; the Navigation API
  // reports those entries too.
  const navigation = (window as Window & { navigation?: EventTarget }).navigation;
  hashListeners.add(listener);
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  navigation?.addEventListener("currententrychange", listener);
  return () => {
    hashListeners.delete(listener);
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
    navigation?.removeEventListener("currententrychange", listener);
  };
}

function setHash(hash: string) {
  const { pathname, search } = window.location;
  window.history.pushState(null, "", hash ? `#${hash}` : `${pathname}${search}`);
  for (const listener of hashListeners) listener();
}

function useHash() {
  return useSyncExternalStore(subscribeToHash, () => window.location.hash, () => "");
}

const LABEL = "font-mono text-2xs tracking-[0.04em] text-subtle-foreground";

interface PageLink {
  title: string;
  href: string;
}

export interface ComponentPlaygroundProps {
  title: string;
  /** Drawn before the title: the page's sidebar icon. */
  icon?: ReactNode;
  description?: string;
  /** The page's own demo first; more are offered as a "Demo" setting. */
  demos: PlaygroundDemo[];
  previous?: PageLink;
  next?: PageLink;
  toc: TocItem[];
  installCommand: string;
  markdownUrl: string;
  /** A standalone full-screen page for the component, when it has one. */
  fullscreenHref?: string;
  /** The rendered documentation. */
  children: ReactNode;
}

/**
 * A component page: the demo on a canvas, its title, install actions and settings in a panel
 * beside it, and the documentation one tab away. Below `lg` the three stack.
 */
export function ComponentPlayground({ demos, ...props }: ComponentPlaygroundProps) {
  const [demoName, setDemoName] = useState(demos[0]!.name);
  const [expanded, setExpanded] = useState(false);

  return (
    <PlaygroundFrame
      // A different demo starts from its own defaults.
      key={demoName}
      {...props}
      demos={demos}
      demoName={demoName}
      onDemoChange={setDemoName}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />
  );
}

function PlaygroundFrame({
  title,
  icon,
  description,
  demos,
  demoName,
  onDemoChange,
  expanded,
  onExpandedChange,
  previous,
  next,
  toc,
  installCommand,
  markdownUrl,
  fullscreenHref,
  children,
}: ComponentPlaygroundProps & {
  demoName: PlaygroundDemo["name"];
  onDemoChange: (name: PlaygroundDemo["name"]) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const hash = useHash();
  const view = hash ? "docs" : "preview";
  const demo = useComponentDemo(demoName);
  const fullView = expanded && view === "preview";
  // From `lg` the docs scroll inside the frame, so the window never does; below it, the page.
  const docsRef = useRef<HTMLDivElement>(null);

  // Opening the docs at a heading: the docs were hidden when the browser or router tried to
  // scroll, so scroll once they are shown.
  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1));
    if (!id) return;
    const target = id === DOCS_HASH ? null : document.getElementById(id);
    if (target) target.scrollIntoView();
    else {
      docsRef.current?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
    }
  }, [hash]);

  return (
    <div data-view={view} data-expanded={fullView || undefined} className="lg:p-2">
      <div
        className={cn(
          "relative grid min-w-0 grid-cols-1 bg-background lg:grid-cols-[minmax(0,1fr)_21rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-clip lg:rounded-xl lg:shadow-border",
          fullView
            ? "fixed inset-0 z-40 h-dvh lg:rounded-none lg:shadow-none"
            : "lg:h-[calc(100dvh-1rem)]",
        )}
      >
        {/* Below `lg` the page reads top to bottom, as one document: contents, title, the
            demo, its settings, the docs, then the neighbouring pages. The playground's grid and
            tabs only start at `lg`; until then the stage section dissolves (`contents`) so its
            parts can take their places in that order. */}
        {toc.length > 0 ? (
          <div className="contents lg:hidden">
            <MobileToc items={toc} />
          </div>
        ) : null}

        <header className="flex flex-col gap-3 px-5 pt-7 pb-5 max-lg:order-1 sm:px-10 lg:col-start-2 lg:row-start-1 lg:border-l lg:px-5 lg:pt-5">
          <h1 className="flex items-center gap-2.5 text-xl font-semibold text-balance">
            {icon}
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-pretty text-muted-foreground">{description}</p>
          ) : null}
          <div className="mt-1 flex gap-2">
            <CopyButton
              value={markdownUrl}
              icon={<LinkIcon />}
              variant="outline"
              size="sm"
              iconPosition="start"
              swapLabel={false}
              className="min-w-0 cursor-default bg-background lg:grow"
            >
              Copy link
            </CopyButton>
            <CopyButton
              value={installCommand}
              icon={<Terminal />}
              variant="outline"
              size="sm"
              iconPosition="start"
              swapLabel={false}
              className="min-w-0 cursor-default bg-background lg:grow"
            >
              Install command
            </CopyButton>
          </div>
        </header>

        <section
          aria-label={view === "preview" ? `${title} preview` : `${title} documentation`}
          className="relative flex min-h-0 min-w-0 flex-col max-lg:contents lg:col-start-1 lg:row-span-2 lg:row-start-1"
        >
          {/* A translucent bar, from `lg` only. In the docs it lies over the top of the docs
              scroll area, so the article passes under it. */}
          <div
            className={cn(
              "top-0 z-10 flex h-12 shrink-0 items-center justify-between gap-2 bg-background/75 px-3 backdrop-blur-md max-lg:hidden",
              view === "docs" && "lg:absolute lg:inset-x-0",
            )}
          >
            <Tabs
              variant="segment"
              appearance="outline"
              size="sm"
              value={view}
              onValueChange={(next) => {
                if (next === "docs") setHash(DOCS_HASH);
                else {
                  setHash("");
                  window.scrollTo({ top: 0 });
                }
              }}
            >
              <TabsList aria-label="View">
                <TabsTab value="preview">Preview</TabsTab>
                <TabsTab value="docs">Docs</TabsTab>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-1">
              {view === "preview" && demo.replayable ? (
                <Tooltip content="Replay animation" delay={0}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Replay ${title} animation`}
                    onClick={demo.replay}
                  >
                    <RotateCcw />
                  </Button>
                </Tooltip>
              ) : null}
              {previous ? <PageButton link={previous} direction="previous" /> : null}
              {next ? <PageButton link={next} direction="next" /> : null}
              {fullscreenHref ? (
                <Tooltip content="Open in new tab" delay={0}>
                  <Button asChild variant="ghost" size="icon-sm">
                    <a href={fullscreenHref} target="_blank" rel="noreferrer" aria-label={`Open ${title} full screen in a new tab`}>
                      <ExternalLink />
                    </a>
                  </Button>
                </Tooltip>
              ) : null}
              {view === "preview" ? (
                <Tooltip content={fullView ? "Exit full view" : "Full view"} delay={0}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={fullView ? "Exit full view" : "Full view"}
                    aria-pressed={fullView}
                    className="max-lg:hidden"
                    onClick={() => onExpandedChange(!fullView)}
                  >
                    {fullView ? <Minimize2 /> : <Maximize2 />}
                  </Button>
                </Tooltip>
              ) : null}
            </div>
          </div>

          {/* Both axes: a wide demo scrolls sideways. `*:h-full` gives the scroll area's content
              box the viewport's height, so the canvas's own `min-h-full` can centre the demo and
              the app-shell demos' `h-full` can fill it; a taller demo overflows it and scrolls.
              Below `lg` it always shows, above the docs, boxed together with its settings, and
              with the replay control on the canvas since the toolbar is desktop-only. */}
          <div
            className={cn(
              "relative flex min-h-0 flex-col max-lg:order-2 max-lg:mx-5 max-lg:mb-4 max-lg:overflow-hidden max-lg:rounded-xl max-lg:shadow-border sm:max-lg:mx-10 lg:flex-1",
              view === "docs" && "lg:hidden",
            )}
          >
            <ScrollArea
              orientation="both"
              className="h-[24rem] lg:h-auto lg:flex-1"
              viewportClassName="*:h-full"
            >
              <DemoCanvas demo={demo} />
            </ScrollArea>
            {hasDemoSettings(demo) || demos.length > 1 ? (
              <div className="mx-auto w-full max-w-[400px] px-3 pt-2 pb-5 lg:hidden">
                <PlaygroundSettings
                  title={title}
                  demo={demo}
                  demos={demos}
                  demoName={demoName}
                  onDemoChange={onDemoChange}
                  idPrefix="playground-box"
                />
              </div>
            ) : null}
            {demo.replayable ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Replay ${title} animation`}
                className="absolute top-2 right-2 lg:hidden"
                onClick={demo.replay}
              >
                <RotateCcw />
              </Button>
            ) : null}
          </div>
          {/* From `lg` the docs scroll here, under the toolbar: the viewport starts 3rem down
              so the article opens below it, headings stop clear of it, and the scrollbar starts
              under it. Below `lg` nothing bounds the height, so the page scrolls instead.
              `relative` on the viewport makes it the containing block for the docs' absolutely
              positioned pieces (`sr-only` text among them), so they scroll with the article. */}
          <ScrollArea
            viewportRef={docsRef}
            className={cn(
              "max-lg:order-4 lg:flex-1 lg:[--scroll-area-inset-top:3rem]",
              view !== "docs" && "lg:hidden",
            )}
            viewportClassName="relative lg:pt-12 lg:[&_[id]]:scroll-mt-18"
          >
            <div className="prose mx-auto w-full max-w-[44rem] px-5 pt-6 pb-16 sm:px-10 lg:pt-0 lg:pb-24">
              {children}
            </div>
          </ScrollArea>
        </section>

        {/* The side panel's settings, from `lg`; below it they sit in the demo's box. */}
        <ScrollArea
          className={cn(
            "max-lg:hidden lg:col-start-2 lg:row-start-2 lg:border-l",
            view === "docs" && "lg:hidden",
          )}
          viewportClassName="px-5 pt-1 pb-10"
        >
          <PlaygroundSettings
            title={title}
            demo={demo}
            demos={demos}
            demoName={demoName}
            onDemoChange={onDemoChange}
            idPrefix="playground"
          />
          {demo.status === "ready" && !hasDemoSettings(demo) && demos.length < 2 ? (
            <p className="text-sm text-subtle-foreground">This demo has no settings.</p>
          ) : null}
        </ScrollArea>
        {view === "docs" ? (
          // The contents list scrolls on its own, without a scrollbar, keeping its active entry
          // in view.
          <div className="flex min-h-0 min-w-0 flex-col px-5 pt-6 pb-10 max-lg:hidden sm:px-10 lg:col-start-2 lg:row-start-2 lg:border-l lg:px-5 lg:pt-1">
            {toc.length > 0 ? (
              <>
                <p className={cn(LABEL, "mb-3")}>On this page</p>
                <TableOfContents
                  aria-label="On this page"
                  variant="single"
                  items={toc}
                  rootRef={docsRef}
                  className="min-h-0 flex-1"
                />
              </>
            ) : null}
          </div>
        ) : null}

        {previous || next ? (
          <nav aria-label="Pages" className="grid grid-cols-2 gap-3 border-t px-5 pt-6 pb-16 max-lg:order-5 sm:px-10 lg:hidden">
            {previous ? <PageCard link={previous} direction="previous" /> : <span />}
            {next ? <PageCard link={next} direction="next" /> : null}
          </nav>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The demo switch and the demo's own settings. Rendered twice, once per layout (the side panel
 * from `lg`, the demo's box below it), so each takes its own id prefix.
 */
function PlaygroundSettings({
  title,
  demo,
  demos,
  demoName,
  onDemoChange,
  idPrefix,
}: {
  title: string;
  demo: ReturnType<typeof useComponentDemo>;
  demos: readonly PlaygroundDemo[];
  demoName: PlaygroundDemo["name"];
  onDemoChange: (name: PlaygroundDemo["name"]) => void;
  idPrefix: string;
}) {
  const demoLabels = demos.map((option) => option.label);
  return (
    <section aria-label={`${title} settings`} className="@container flex flex-col gap-3">
      {demos.length > 1 ? (
        <Controls
          idPrefix={`${idPrefix}-demo`}
          schema={{
            demo: { kind: "select", options: demoLabels, defaultValue: demoLabels[0]!, label: "Demo" },
          }}
          values={{ demo: demos.find((option) => option.name === demoName)!.label }}
          onChange={(_key, label) => {
            const option = demos.find((candidate) => candidate.label === label);
            if (option) onDemoChange(option.name);
          }}
        />
      ) : null}
      <DemoSettings demo={demo} idPrefix={`${idPrefix}-${demoName}`} />
    </section>
  );
}

/** The narrow layout's neighbouring-page link, at the foot of the page. */
function PageCard({ link, direction }: { link: PageLink; direction: "previous" | "next" }) {
  const previous = direction === "previous";
  return (
    <Link
      href={link.href}
      className={cn(
        "flex flex-col gap-1 rounded-lg p-3 outline-none transition-[background-color] duration-(--duration-fast) hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        !previous && "items-end text-right",
      )}
    >
      <span className="flex items-center gap-1 text-2xs text-subtle-foreground">
        {previous ? <ArrowLeft className="size-3" aria-hidden /> : null}
        {previous ? "Previous" : "Next"}
        {previous ? null : <ArrowRight className="size-3" aria-hidden />}
      </span>
      <span className="text-sm font-medium">{link.title}</span>
    </Link>
  );
}

function PageButton({ link, direction }: { link: PageLink; direction: "previous" | "next" }) {
  const label = `${direction === "previous" ? "Previous" : "Next"}: ${link.title}`;
  return (
    <Tooltip content={label} delay={0}>
      <Button asChild variant="ghost" size="icon-sm">
        <Link href={link.href} aria-label={label}>
          {direction === "previous" ? <ArrowLeft /> : <ArrowRight />}
        </Link>
      </Button>
    </Tooltip>
  );
}
