"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import type { NavGroup, NavItem } from "@/lib/site-nav";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/registry/ui/collapsible/collapsible";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/ui/sheet/sheet";

const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-ring";
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

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

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={pathname === item.href ? "page" : undefined}
      className={cn(
        "relative rounded-xs py-1 pl-3 text-sm text-muted-foreground transition-[color] duration-(--duration-fast) hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground",
        // The current page's tick.
        "before:absolute before:top-1/2 before:left-0 before:h-3.5 before:w-px before:-translate-y-1/2 before:bg-foreground before:opacity-0 aria-[current=page]:before:opacity-100",
        FOCUS,
      )}
    >
      {item.title}
    </Link>
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
          "h-full overflow-y-auto overscroll-contain scroll-py-6",
          SCROLLBAR,
          className,
        )}
      >
        <div ref={contentRef} className="flex flex-col gap-6">
        {nav.map((group, index) =>
          group.label ? (
            <Collapsible
              key={group.label}
              defaultOpen
              data-group={group.label}
              onOpenChange={(open) => {
                if (!open) keepAnchored(group.label!);
              }}
            >
              <CollapsibleTrigger
                chevron={false}
                className="mx-0 px-0 pt-0 pb-1.5 font-mono text-2xs font-normal tracking-[0.04em] text-subtle-foreground hover:text-foreground focus-visible:ring-offset-0 data-[panel-open]:text-subtle-foreground data-[panel-open]:hover:text-foreground [&_svg]:size-3"
              >
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
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-0.5 pt-0 text-sm">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <div key={index} className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </div>
          ),
        )}
        </div>
      </nav>
      {/* Overlay only the content, leaving the scrollbar and pointer input available. */}
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-x-0 top-0 me-1.5 h-6 bg-linear-to-b to-transparent opacity-0 transition-[opacity] duration-(--duration-fast) group-data-[overflow-top]/rail-nav:opacity-100", fadeClassName)}
      />
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-x-0 bottom-0 me-1.5 h-6 bg-linear-to-t to-transparent opacity-0 transition-[opacity] duration-(--duration-fast) group-data-[overflow-bottom]/rail-nav:opacity-100", fadeClassName)}
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
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Open navigation">
                  <Menu />
                </Button>
              }
            />
            <SheetContent side="left" exitMotion="slide" className="flex w-72 max-w-[85vw] flex-col gap-0 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <RailNav
                nav={nav}
                onNavigate={() => setMenuOpen(false)}
                className="px-5 pt-6 pb-8"
                fadeClassName="from-surface-raised"
              />
              <div className="px-5 py-4">
                <RailFooter repository={repository} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
