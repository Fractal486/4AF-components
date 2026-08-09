"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/registry/lib/cn";
import {
  tableOfContentsLinesVariants,
  type TableOfContentsLinesVariants,
} from "./table-of-contents-lines.variants";

/** A heading rendered by the line-based table of contents. */
export interface TocLineItem {
  /** The `id` of the heading element this entry points at. */
  id: string;
  title: ReactNode;
  /** Heading depth (h2 = 2, h3 = 3, …). Drives the indent; defaults to 2. */
  level?: number;
}

export interface TableOfContentsLinesProps
  extends Omit<ComponentProps<"nav">, "children">,
    TableOfContentsLinesVariants {
  items: TocLineItem[];
  /** The scroll container, when the content scrolls inside an element rather than the page. */
  rootRef?: RefObject<HTMLElement | null>;
}

/** Fallback for browsers that do not emit `scrollend` after programmatic smooth scrolling. */
const SCROLL_SETTLE_DELAY = 120;

export function TableOfContentsLines({
  items,
  rootRef,
  className,
  ...props
}: TableOfContentsLinesProps) {
  const [currentId, setCurrentId] = useState<string>();
  const [scrollTargetId, setScrollTargetId] = useState<string>();
  const [settledTargetId, setSettledTargetId] = useState<string>();
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const minLevel = useMemo(
    () => (items.length ? Math.min(...items.map((item) => item.level ?? 2)) : 2),
    [items],
  );

  useEffect(
    () => () => {
      scrollCleanupRef.current?.();
    },
    [],
  );

  const scrollTo = (event: MouseEvent, id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    event.preventDefault();

    scrollCleanupRef.current?.();
    setScrollTargetId(id);
    setSettledTargetId(undefined);

    const scrollRootElement = rootRef?.current ?? null;
    const scrollRoot: HTMLElement | Window = scrollRootElement ?? window;
    let settleTimer = 0;
    let disposed = false;

    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      window.clearTimeout(settleTimer);
      scrollRoot.removeEventListener("scroll", scheduleFinish);
      scrollRoot.removeEventListener("scrollend", finish);
      if (scrollCleanupRef.current === cleanup) scrollCleanupRef.current = null;
    };
    const finish = () => {
      cleanup();
      setScrollTargetId((current) => (current === id ? undefined : current));
      setSettledTargetId(id);
    };
    const scheduleFinish = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(finish, SCROLL_SETTLE_DELAY);
    };

    scrollRoot.addEventListener("scroll", scheduleFinish, { passive: true });
    scrollRoot.addEventListener("scrollend", finish, { once: true });
    scrollCleanupRef.current = cleanup;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    element.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
    scheduleFinish();
  };

  // Cache heading offsets when layout changes, then use a binary search during scroll. The scroll
  // path reads only scrollTop/scrollY and schedules one state update per animation frame.
  useEffect(() => {
    const root = rootRef?.current ?? null;
    const elements = items.flatMap((item) => {
      const element = document.getElementById(item.id);
      return element ? [element] : [];
    });

    let positions: { id: string; top: number }[] = [];
    let frame = 0;

    const updateCurrentId = () => {
      if (positions.length === 0) {
        setCurrentId((previous) => (previous === undefined ? previous : undefined));
        return;
      }

      const scrollPosition = (root?.scrollTop ?? window.scrollY) + 1;
      let low = 0;
      let high = positions.length - 1;
      let match = 0;
      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        if (positions[middle]!.top <= scrollPosition) {
          match = middle;
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }
      const nextId = positions[match]!.id;
      setCurrentId((previous) => (previous === nextId ? previous : nextId));
    };

    const measurePositions = () => {
      const viewportTop = root?.getBoundingClientRect().top ?? 0;
      const scrollOffset = root?.scrollTop ?? window.scrollY;
      positions = elements.map((element) => ({
        id: element.id,
        top: element.getBoundingClientRect().top - viewportTop + scrollOffset,
      }));
      updateCurrentId();
    };

    const scheduleUpdate = () => {
      setSettledTargetId((current) => (current === undefined ? current : undefined));
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateCurrentId();
      });
    };

    const scrollTarget: HTMLElement | Window = root ?? window;
    scrollTarget.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", measurePositions);
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measurePositions);
    resizeObserver?.observe(root ?? document.documentElement);
    for (const element of elements) resizeObserver?.observe(element);
    measurePositions();

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measurePositions);
      scrollTarget.removeEventListener("scroll", scheduleUpdate);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [items, rootRef]);

  const activeId = scrollTargetId ?? settledTargetId ?? currentId;

  return (
    <nav
      aria-label="Table of contents"
      data-variant="lines"
      className={cn(tableOfContentsLinesVariants(), className)}
      {...props}
    >
      <ul>
        {items.map((item, itemIndex) => {
          const hasFollowingHeading = itemIndex < items.length - 1;
          const active = item.id === activeId;
          const indent = 0.75 + ((item.level ?? 2) - minLevel) * 0.75;
          const nextItem = items[itemIndex + 1];
          const nextIndent = nextItem
            ? 0.75 + ((nextItem.level ?? 2) - minLevel) * 0.75
            : indent;
          const secondaryOffset = nextIndent - indent;

          return (
            <li key={item.id} data-toc-id={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => scrollTo(event, item.id)}
                aria-current={active ? "location" : undefined}
                data-active={active ? "true" : "false"}
                style={{ paddingInlineStart: `${indent}rem` }}
                className={cn(
                  "group grid h-7 grid-cols-[1.5rem_minmax(0,1fr)] grid-rows-3 items-center gap-x-2.5 text-sm leading-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "text-muted-foreground transition-[color,translate] duration-(--duration-slow) ease-out",
                  "hover:text-foreground focus-visible:text-foreground",
                  active && "text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="col-start-1 row-span-3 row-start-1 grid h-full w-6 grid-rows-3 items-center"
                >
                  <span
                    className={cn(
                      "h-px w-6 origin-left rounded-full bg-border-strong",
                      "transition-[scale,background-color] duration-(--duration-slow) ease-out",
                      "group-hover:scale-x-[1.25] group-hover:bg-foreground",
                      "group-focus-visible:scale-x-[1.25] group-focus-visible:bg-foreground",
                      active && "scale-x-[1.25] bg-foreground",
                    )}
                  />
                  {hasFollowingHeading && (
                    <>
                      <span
                        className="h-px w-4 rounded-full bg-border"
                        style={{ transform: `translateX(${secondaryOffset}rem)` }}
                      />
                      <span
                        className="h-px w-4 rounded-full bg-border"
                        style={{ transform: `translateX(${secondaryOffset}rem)` }}
                      />
                    </>
                  )}
                </span>
                <span
                  className={cn(
                    "col-start-2 row-start-1 min-w-0 self-center transition-[translate] duration-(--duration-slow) ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1",
                    active && "translate-x-1",
                  )}
                >
                  {item.title}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
