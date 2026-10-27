"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Link as LinkIcon, Maximize2, Minimize2, RotateCcw, Terminal } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Controls } from "@/inspector/controls";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";
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
  const demoLabels = demos.map((option) => option.label);
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
        <header className="flex flex-col gap-3 px-5 pt-7 pb-5 sm:px-10 lg:col-start-2 lg:row-start-1 lg:border-l lg:px-5 lg:pt-5">
          <h1 className="text-xl font-semibold text-balance">{title}</h1>
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
              className="min-w-0 grow cursor-default bg-background"
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
              className="min-w-0 grow cursor-default bg-background"
            >
              Install command
            </CopyButton>
          </div>
        </header>

        <section
          aria-label={view === "preview" ? `${title} preview` : `${title} documentation`}
          className="flex min-h-0 min-w-0 flex-col max-lg:border-y lg:col-start-1 lg:row-span-2 lg:row-start-1"
        >
          <div className="sticky top-14 z-10 flex h-12 shrink-0 items-center justify-between gap-2 bg-background/90 px-3 backdrop-blur-sm lg:top-0">
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

          {view === "preview" ? (
            <div className="h-[36rem] min-h-0 overflow-auto lg:h-auto lg:flex-1">
              <DemoCanvas demo={demo} />
            </div>
          ) : null}
          <div
            ref={docsRef}
            hidden={view !== "docs"}
            // The toolbar sits above this scroll area rather than over it, so headings need
            // only a small margin here instead of the page's sticky-bar clearance. `relative`
            // makes it the containing block for the docs' absolutely positioned pieces (`sr-only`
            // text among them): without one they resolve against the page, sit at their place
            // far down the long article, and stretch the window's scroll height from behind
            // the frame, which only clips what is positioned inside it.
            className="min-h-0 lg:relative lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-width:thin] lg:[&_[id]]:scroll-mt-6"
          >
            <div className="prose mx-auto w-full max-w-[44rem] px-5 pb-16 sm:px-10 lg:pb-24">
              {children}
            </div>
          </div>
        </section>

        <div
          className={cn(
            "min-w-0 px-5 pt-6 pb-10 sm:px-10 lg:col-start-2 lg:row-start-2 lg:border-l lg:px-5 lg:pt-1",
            view === "preview" ? "lg:min-h-0 lg:overflow-y-auto" : "flex min-h-0 flex-col max-lg:hidden",
          )}
        >
          {view === "preview" ? (
            <section aria-label={`${title} settings`} className="@container flex flex-col gap-3">
              {demos.length > 1 ? (
                <Controls
                  idPrefix="playground-demo"
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
              <DemoSettings demo={demo} idPrefix={`playground-${demoName}`} />
              {demo.status === "ready" && !hasDemoSettings(demo) && demos.length < 2 ? (
                <p className="text-sm text-subtle-foreground">This demo has no settings.</p>
              ) : null}
            </section>
          ) : toc.length > 0 ? (
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
      </div>
    </div>
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
