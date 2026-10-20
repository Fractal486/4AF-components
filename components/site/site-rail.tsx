"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import type { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { NavGroup, NavItem } from "@/lib/site-nav";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/registry/ui/collapsible/collapsible";
import { Sheet, SheetTitle, SheetTrigger } from "@/registry/ui/sheet/sheet";
import { BlueprintCard, createBlueprintHandle, type BlueprintHandle } from "./blueprint-card";
import { SiteNavigationContent } from "./site-navigation-content";

const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-ring";
/** The rail still scrolls by wheel, touch and keyboard; it just draws no scrollbar. */
const SCROLLBAR =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

function Brand() {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 rounded-xs text-[15px] font-semibold tracking-[-0.01em]", FOCUS)}>
      <Image
        src="/icon.png"
        alt=""
        width={822}
        height={724}
        unoptimized
        className="h-4 w-auto shrink-0 invert outline-none dark:invert-0"
      />
      <span>4AF Components</span>
    </Link>
  );
}

function SearchField() {
  const { setOpenSearch, hotKey } = useSearchContext();
  return (
    <button
      type="button"
      onClick={() => setOpenSearch(true)}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-md bg-surface px-2.5 text-sm text-subtle-foreground shadow-border transition-[color] duration-(--duration-fast) hover:text-muted-foreground",
        FOCUS,
      )}
    >
      <Search className="size-3.5" aria-hidden />
      Search
      <kbd className="ms-auto flex gap-0.5 font-mono text-2xs">
        {hotKey.map((key, index) => (
          <span key={index}>{key.display}</span>
        ))}
      </kbd>
    </button>
  );
}

/**
 * The rail is one continuous ruler: every row draws a rule beside its label and two minor
 * ticks below it, and group headings stand in the rule column instead. The current page's rule is drawn at
 * full reach in the accent. A lens centres on the hovered (or keyboard-focused) row: rules
 * near it reach further and take the accent, falling off with distance, and labels ride out
 * on the ends of their rules.
 */
/**
 * How far each tick reaches, by its distance in ticks from the hovered rule: two rows on
 * either side (six ticks), then one minor tick past them. The nearest labelled rule (three
 * ticks away) reaches a third, so the hovered rule is 1.5× its length.
 */
const LENS_REACH = [1, 0.68, 0.47, 0.33, 0.23, 0.15, 0.09, 0.04];
/** How much further a rule reaches at the centre of the lens: a resting rule doubled. */
const REACH_PX = 24;
const RULE_PX = { item: 24, minor: 16 };
const LABEL_GAP_PX = 10;
/** A row is three tracks of the ruler: its rule, then two minor ticks. */
const TRACK_PX = 28 / 3;
/**
 * A heading takes a track more above and below its label, so the space around it keeps the
 * ruler's rhythm: a minor tick above, the label's own track (no rule), then three minors.
 */
const HEADING_TRACKS = 5;
const tracksOf = (row: Element) => (row.hasAttribute("data-rail-heading") ? HEADING_TRACKS : 3);
/**
 * The three ticks either side of a heading's label fade toward it, nearest first, so the
 * label sits in a soft break in the ruler rather than a hard one.
 */
const HEADING_FADE = [0.25, 0.5, 0.75];

/**
 * Writes the lens onto the rows as custom properties: `--lens-r{n}` is how far the rule
 * on the row's nth track reaches (0–1), `--lens-c{n}` how much accent it takes. Distance
 * is counted in ticks, so the minor ticks fall off along the same curve as the rules.
 */
function focusLens(nav: HTMLElement, hovered: Element | null) {
  const rows = Array.from(nav.querySelectorAll<HTMLElement>("[data-rail-row]")).filter(
    (row) => !row.closest('[data-slot="collapsible-panel"][data-closed]'),
  );
  const current = nav.querySelector("[aria-current=page]");
  // A heading has no rule to centre on, so hovering one lights its label and nothing else.
  const center =
    hovered && !hovered.hasAttribute("data-rail-heading")
      ? rows.indexOf(hovered as HTMLElement)
      : -1;
  // The lens stays inside the hovered row's section: rows across a heading are untouched.
  const section = rows[center]?.closest("[data-rail-group]");
  // The hovered row's group heading lights with it, wherever it falls in the lens.
  const heading = section?.querySelector("[data-rail-heading]");

  // Where each row's first track falls along the ruler, counted in tracks.
  const starts: number[] = [];
  rows.reduce((start, row) => (starts.push(start), start + tracksOf(row)), 0);
  const centerTrack = starts[center] ?? 0;

  rows.forEach((row, index) => {
    const lit = row === hovered || row === heading;
    const isHeading = row.hasAttribute("data-rail-heading");
    const inSection = (candidate: Element | undefined) =>
      section !== undefined && candidate?.closest("[data-rail-group]") === section;
    for (let tick = 0; tick < tracksOf(row); tick++) {
      // A heading's first tick is the space above its label, and continues the ruler down
      // from the section before; the lens reaches it from that side only.
      const owner = isHeading && tick === 0 ? rows[index - 1] : row;
      const distance = inSection(owner)
        ? Math.abs((starts[index] ?? 0) + tick - centerTrack)
        : Infinity;
      const reach =
        tick === 0 && row === current ? 1 : (LENS_REACH[distance] ?? 0);
      const marked = tick === 0 && !isHeading && (lit || row === current);
      row.style.setProperty(`--lens-r${tick}`, String(reach));
      // The accent fades evenly, tick by tick, and more gently than the length, so the far
      // ticks, which barely lengthen, still read as part of the lens.
      const tint = Math.max(0, 1 - distance / LENS_REACH.length);
      row.style.setProperty(`--lens-c${tick}`, String(marked ? 1 : tint));
    }
    row.toggleAttribute("data-lit", lit);
  });

  // Fade the ticks around each heading's label: the space track above it and the previous
  // row's two minors, then the three minors below it.
  const fade = (row: HTMLElement | undefined, tick: number, opacity: number) =>
    row?.style.setProperty(`--lens-o${tick}`, String(opacity));
  for (const row of rows) for (let tick = 0; tick < tracksOf(row); tick++) fade(row, tick, 1);
  rows.forEach((row, index) => {
    if (!row.hasAttribute("data-rail-heading")) return;
    const [near, middle, far] = HEADING_FADE as [number, number, number];
    const previous = rows[index - 1];
    if (previous && !previous.hasAttribute("data-rail-heading")) {
      fade(previous, 1, far);
      fade(previous, 2, middle);
    }
    fade(row, 0, near);
    fade(row, 2, near);
    fade(row, 3, middle);
    fade(row, 4, far);
  });
}

/**
 * A rule takes longer the further it is going: resting rules settle over the `slower`
 * token, and a rule growing to full reach takes half as long again. The duration is read at
 * the new reach, so a long rule draws out slowly and retracts at the base pace. Scaling
 * the token keeps reduced motion's collapse intact.
 */
const lensDuration = (tick: number) =>
  `calc(var(--duration-slower) * (1 + 0.5 * var(--lens-r${tick}, 0)))`;

function Rule({ tick, rest, color }: { tick: number; rest: number; color: string }) {
  return (
    <span
      className="h-px rounded-full transition-[clip-path,background-color,opacity] ease-out"
      style={{
        // Drawn at full length and revealed by `clip-path`, as in TableOfContentsLines:
        // scaling a hairline resamples it and it thickens mid-transition.
        width: rest + REACH_PX,
        clipPath: `inset(0 calc((1 - var(--lens-r${tick}, 0)) * ${REACH_PX}px) 0 0)`,
        transitionDuration: lensDuration(tick),
        opacity: `var(--lens-o${tick}, 1)`,
        backgroundColor: `color-mix(in oklab, var(--color-foreground) calc(var(--lens-c${tick}, 0) * 100%), ${color})`,
      }}
    />
  );
}

/**
 * A row's rules and its label, which sits on the first of the three tracks.
 *
 * A group heading passes no `rule`: it draws no rule of its own and its label stands in the
 * rule column, flush with the start of the ruler, while its minor ticks keep the ruler
 * running beneath it. Headings are told apart by where they sit, not by length or
 * brightness, which belong to the lens and the current page.
 */
function RailRow({ rule, children }: { rule?: number; children: ReactNode }) {
  const heading = rule === undefined;
  const tracks = heading ? HEADING_TRACKS : 3;
  const grid = { gridTemplateRows: `repeat(${tracks}, minmax(0, 1fr))` };
  const minor = (tick: number) => (
    <Rule key={tick} tick={tick} rest={RULE_PX.minor} color="var(--color-border)" />
  );

  return (
    <span
      className="relative grid items-center"
      style={{ ...grid, height: tracks * TRACK_PX }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 start-0 grid items-center"
        style={grid}
      >
        {heading ? (
          <>
            {minor(0)}
            <span />
            {minor(2)}
            {minor(3)}
            {minor(4)}
          </>
        ) : (
          <>
            <Rule tick={0} rest={rule} color="var(--color-border-strong)" />
            {minor(1)}
            {minor(2)}
          </>
        )}
      </span>
      <span
        className={cn(
          "min-w-0 truncate transition-[translate] ease-out",
          heading ? "row-start-2" : "row-start-1",
        )}
        style={
          rule === undefined
            ? undefined
            : {
                paddingInlineStart: rule + LABEL_GAP_PX,
                translate: `calc(var(--lens-r0, 0) * ${REACH_PX}px) 0`,
                transitionDuration: lensDuration(0),
              }
        }
      >
        {children}
      </span>
    </span>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
  blueprints,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  blueprints: BlueprintHandle;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      data-rail-row=""
      aria-current={pathname === item.href ? "page" : undefined}
      className={cn(
        "block rounded-xs text-sm leading-none text-muted-foreground transition-[color] duration-(--duration-slow) ease-out",
        "aria-[current=page]:font-medium aria-[current=page]:text-foreground data-lit:text-foreground",
        FOCUS,
      )}
    >
      <RailRow rule={RULE_PX.item}>{item.title}</RailRow>
    </Link>
  );

  return item.blueprint ? (
    <BaseTooltip.Trigger
      handle={blueprints}
      payload={item.blueprint}
      delay={0}
      closeDelay={0}
      render={link}
    />
  ) : (
    link
  );
}

function RailNav({
  nav,
  className,
  fadeClassName = "from-background",
  onNavigate,
}: {
  nav: NavGroup[];
  className?: string;
  fadeClassName?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  /** The row the pointer or keyboard is on; `null` leaves only the current page marked. */
  const lensTarget = useRef<Element | null>(null);
  const [blueprints] = useState(createBlueprintHandle);

  const aimLens = (row: Element | null) => {
    if (row === lensTarget.current) return;
    lensTarget.current = row;
    if (ref.current) focusLens(ref.current, row);
  };

  useEffect(() => {
    if (ref.current) focusLens(ref.current, lensTarget.current);
  }, [nav, pathname]);

  /**
   * Collapsing a group near the bottom of a scrolled rail leaves the list shorter than its
   * scroll position, and the browser clamps that position on every frame of the height
   * animation — a main-thread correction that lands a frame behind, so the rows above judder
   * down. Instead, take the whole correction up front and hide it behind an equal
   * `translate`, then let the translate run out over the collapse's own duration and easing.
   * The rows glide down on the compositor and the list never needs clamping.
   */
  const keepAnchored = (label: string) => {
    const list = ref.current;
    const content = contentRef.current;
    const panel = content?.querySelector<HTMLElement>(
      `[data-group="${CSS.escape(label)}"] [data-slot="collapsible-panel"]`,
    );
    if (!list || !content || !panel) return;

    const room = list.scrollHeight - list.clientHeight - list.scrollTop;
    const deficit = panel.offsetHeight - room;
    if (deficit <= 0) return;

    const before = list.scrollTop;
    list.scrollTop = before - deficit;
    const moved = before - list.scrollTop;
    if (moved <= 0) return;

    content.style.transition = "none";
    content.style.translate = `0 ${-moved}px`;
    // Commit the offset before transitioning away from it.
    void content.offsetHeight;
    content.style.transition = "translate var(--duration-base) var(--ease-out)";
    content.style.translate = "";
    const done = (event: TransitionEvent) => {
      if (event.target !== content || event.propertyName !== "translate") return;
      content.style.transition = "";
      content.removeEventListener("transitionend", done);
    };
    content.addEventListener("transitionend", done);
  };

  useEffect(() => {
    const list = ref.current;
    const viewport = viewportRef.current;
    if (!list || !viewport) return;

    const updateEdges = () => {
      const limit = Math.max(0, list.scrollHeight - list.clientHeight);
      viewport.toggleAttribute("data-overflow-top", list.scrollTop > 1);
      viewport.toggleAttribute("data-overflow-bottom", list.scrollTop < limit - 1);
    };
    const resize = new ResizeObserver(updateEdges);
    resize.observe(list);
    // Also catches content reflow when fonts load or navigation groups change.
    for (const group of contentRef.current?.children ?? []) resize.observe(group);
    list.addEventListener("scroll", updateEdges, { passive: true });
    updateEdges();
    return () => {
      resize.disconnect();
      list.removeEventListener("scroll", updateEdges);
    };
  }, [nav]);

  // Long lists put the current page below the fold; bring it into the rail's view.
  useEffect(() => {
    ref.current
      ?.querySelector("[aria-current=page]")
      ?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <div ref={viewportRef} className="group/rail-nav relative min-h-0 flex-1">
      <nav
        ref={ref}
        aria-label="Site"
        className={cn(
          // `overflow-x-hidden`: a label riding out on its rule may pass into the
          // padding, and must not open a horizontal scrollbar when it does.
          "h-full overflow-y-auto overflow-x-hidden overscroll-contain scroll-py-40",
          SCROLLBAR,
          className,
        )}
        onPointerOver={(event) => {
          const row = (event.target as Element).closest("[data-rail-row]");
          if (row) aimLens(row);
        }}
        onPointerLeave={() => aimLens(null)}
        onFocus={(event) => {
          if (event.target.matches(":focus-visible")) {
            aimLens(event.target.closest("[data-rail-row]"));
          }
        }}
        onBlur={(event) => {
          const nav = event.currentTarget;
          if (!nav.contains(event.relatedTarget) && !nav.matches(":hover")) aimLens(null);
        }}
      >
        {/* `pt-1`: each label overhangs its row's first track slightly. */}
        <div ref={contentRef} className="flex flex-col pt-1">
        {nav.map((group) =>
          group.label ? (
            <Collapsible
              key={group.label}
              defaultOpen
              data-group={group.label}
              data-rail-group=""
              onOpenChange={(open) => {
                if (!open) keepAnchored(group.label!);
                // The rows the lens spans change; re-measure once the panel has updated.
                requestAnimationFrame(() => {
                  if (ref.current) focusLens(ref.current, lensTarget.current);
                });
              }}
            >
              <CollapsibleTrigger
                chevron={false}
                data-rail-row=""
                data-rail-heading=""
                className="m-0 block rounded-xs p-0 text-2xs leading-none font-normal text-subtle-foreground focus-visible:ring-offset-0 data-[panel-open]:text-subtle-foreground transition-[color] duration-(--duration-slow) ease-out data-lit:text-foreground data-lit:data-[panel-open]:text-foreground [&_svg]:size-3"
              >
                <RailRow>
                <span className="flex items-center gap-1">
                  {group.label}
                  {/* Absent while the group is open; collapsing turns it from down to right
                      as it fades in, so it only marks the groups that are hiding rows. The
                      fade (300ms) brackets the turn (200ms, held 50ms): it starts before the
                      chevron moves and finishes after it lands. Both scale with the tokens. */}
                  <ChevronDown
                    aria-hidden
                    className="-rotate-90 [transition:rotate_var(--duration-base)_var(--ease-out)_calc(var(--duration-fast)/3),opacity_var(--duration-slow)_var(--ease-out)] group-data-[panel-open]/collapsible-trigger:rotate-0 group-data-[panel-open]/collapsible-trigger:opacity-0"
                  />
                </span>
                </RailRow>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col pt-0 text-sm">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} blueprints={blueprints} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : // The unlabelled lead group is only the overview, which the brand above
              // already links to; alone above the first heading it read as a stray rule.
              null,
        )}
        </div>
      </nav>
      <BlueprintCard handle={blueprints} />
      {/* Overlay the content without taking pointer input. The blur is masked to the same
          gradient as the colour, so rows soften progressively as they reach the edge. */}
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b to-transparent backdrop-blur-[3px] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-0 transition-[opacity] duration-(--duration-fast) group-data-[overflow-top]/rail-nav:opacity-100", fadeClassName)}
      />
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t to-transparent backdrop-blur-[3px] [mask-image:linear-gradient(to_top,black,transparent)] opacity-0 transition-[opacity] duration-(--duration-fast) group-data-[overflow-bottom]/rail-nav:opacity-100", fadeClassName)}
      />
    </div>
  );
}

/** GitHub's mark; lucide no longer ships brand logos. */
function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function RailFooter({ repository }: { repository: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm">
          <a href={repository} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <GitHubMark />
          </a>
        </Button>
        <span className="font-mono text-2xs text-subtle-foreground">MIT-0</span>
      </div>
      <ThemeSwitch />
    </div>
  );
}

/**
 * The one sidebar of the site. At `lg` it is a full-height column; below it, a top bar whose
 * menu opens the same navigation in a sheet.
 */
export function SiteRail({
  nav,
  repository,
}: {
  nav: NavGroup[];
  repository: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuActions = useRef<BaseDialog.Root.Actions | null>(null);
  const { setOpenSearch } = useSearchContext();

  return (
    <>
      <aside className="flex h-full flex-col max-lg:hidden">
        <div className="flex flex-col gap-5 px-6 pt-7 pb-5">
          <Brand />
          <SearchField />
        </div>
        <RailNav
          nav={nav}
          className="px-6 pb-8"
        />
        <div className="px-6 py-4">
          <RailFooter repository={repository} />
        </div>
      </aside>

      <div className="flex h-14 items-center justify-between gap-3 px-4 lg:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setOpenSearch(true)}>
            <Search />
          </Button>
          <Sheet
            open={menuOpen}
            actionsRef={menuActions}
            onOpenChange={(open, details) => {
              // Motion owns this drawer's exit; keep Base UI from hiding it early.
              if (!open) details.preventUnmountOnClose();
              setMenuOpen(open);
            }}
          >
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Open navigation">
                  <Menu />
                </Button>
              }
            />
            <SiteNavigationContent
              open={menuOpen}
              onExitComplete={() => menuActions.current?.unmount()}
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <RailNav
                nav={nav}
                onNavigate={() => menuActions.current?.close()}
                className="px-5 pt-6 pb-8"
                fadeClassName="from-surface-raised"
              />
              <div className="px-5 py-4">
                <RailFooter repository={repository} />
              </div>
            </SiteNavigationContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
