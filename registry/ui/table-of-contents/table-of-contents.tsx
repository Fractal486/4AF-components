"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A table of contents that tracks the reader.
 *
 * Give it the headings (`{ id, title, level }`) and it lights every entry whose heading is
 * currently on screen. The rail marker spans that visible range so the labels and marker stay
 * together when several sections are visible. When ordinary prose leaves the viewport with no
 * heading intersecting, it falls back to the last section whose heading has been passed.
 *
 * The marker is an SVG stroke on a straight rail: its visible length is a dash
 * (`stroke-dasharray`/`stroke-dashoffset`) covering the visible range, animated with a single
 * CSS transition. `stroke-linecap="round"` gives true rounded caps at any length — no `scaleY`
 * stretching a corner radius — and because it's CSS, reduced motion collapses the
 * `--duration-*` token to 1ms for free.
 *
 * Sub-headings indent their *text* to show the hierarchy, but the rail stays a single
 * straight line — the marker never has to weave, so it reads as one continuous track.
 *
 * Pass `rootRef` when the content scrolls inside a container rather than the page.
 */

export interface TocItem {
  /** The `id` of the section (or heading) element this entry points at. */
  id: string;
  title: ReactNode;
  /** Heading depth (h2 = 2, h3 = 3, …). Drives the indent; defaults to 2. */
  level?: number;
}

export interface TableOfContentsProps extends Omit<ComponentProps<"nav">, "children"> {
  items: TocItem[];
  /** The scroll container, when the content scrolls inside an element rather than the page. */
  rootRef?: RefObject<HTMLElement | null>;
}

/** Inset (px) so the marker's rounded ends sit inside the lit rows rather than on their edges. */
const MARKER_PAD = 4;

interface RailGeometry {
  /** Y of the rail's top (the first entry's top), in the SVG's pixel coordinates. */
  top: number;
  /** Rail length in pixels — the full span from the first entry's top to the last's bottom. */
  total: number;
  /** Per-entry range along the rail, keyed by id. `start` is measured from `top`. */
  segments: { id: string; start: number; length: number }[];
}

function scrollTo(event: MouseEvent, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function TableOfContents({ items, rootRef, className, ...props }: TableOfContentsProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string>();
  const [geometry, setGeometry] = useState<RailGeometry | null>(null);
  const minLevel = useMemo(
    () => (items.length ? Math.min(...items.map((item) => item.level ?? 2)) : 2),
    [items],
  );
  const visible = useRef<Map<string, boolean>>(new Map());

  // Cache heading offsets when layout changes, then use a binary search during scroll.
  // The hot path reads only scrollTop/scrollY: no per-heading layout reads and at most one
  // state update per animation frame.
  useEffect(() => {
    visible.current = new Map();
    const root = rootRef?.current ?? null;
    const elements: HTMLElement[] = [];
    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) elements.push(element);
    }

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
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateCurrentId();
      });
    };

    const scrollTarget: HTMLElement | Window = root ?? window;
    scrollTarget.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", measurePositions);
    const resizeObserver = new ResizeObserver(measurePositions);
    resizeObserver.observe(root ?? document.documentElement);
    for (const element of elements) resizeObserver.observe(element);
    measurePositions();

    const observer =
      elements.length > 0
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) visible.current.set(entry.target.id, entry.isIntersecting);
              const nextVisibleIds: string[] = [];
              for (const item of items) {
                if (visible.current.get(item.id)) nextVisibleIds.push(item.id);
              }
              setVisibleIds(nextVisibleIds);
            },
            { root, threshold: 0 },
          )
        : null;
    if (observer) {
      for (const element of elements) observer.observe(element);
    }

    return () => {
      observer?.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", measurePositions);
      scrollTarget.removeEventListener("scroll", scheduleUpdate);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [items, rootRef]);

  // Measure the rail from the list layout: the straight track down the left edge and each
  // entry's slice of it. Re-measured on content or size changes, never on scroll — the
  // marker's position is a dash offset, so scrolling only swaps which slice is shown.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const rows = items
        .map((item) => list.querySelector<HTMLElement>(`[data-toc-id="${CSS.escape(item.id)}"]`))
        .filter((row): row is HTMLElement => row != null);
      if (rows.length === 0) {
        setGeometry(null);
        return;
      }
      const first = rows[0]!;
      const last = rows[rows.length - 1]!;
      const top = first.offsetTop;
      const total = last.offsetTop + last.offsetHeight - top;
      setGeometry({
        top,
        total,
        segments: rows.map((row) => ({
          id: row.dataset.tocId!,
          start: row.offsetTop - top,
          length: row.offsetHeight,
        })),
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items]);

  // The dash spans the first through last visible entry. If no heading is intersecting, fall
  // back to the current section so the marker does not disappear in prose.
  const visibleSet = new Set(visibleIds);
  const litSegments = geometry?.segments.filter((segment) => visibleSet.has(segment.id)) ?? [];
  const currentSegment = geometry?.segments.find((segment) => segment.id === currentId);
  const currentHighlightId = visibleIds[0] ?? currentId;
  const markerSegments = litSegments.length > 0 ? litSegments : currentSegment ? [currentSegment] : [];
  const marker =
    markerSegments.length > 0
      ? (() => {
          const first = markerSegments[0]!;
          const last = markerSegments[markerSegments.length - 1]!;
          const start = first.start + MARKER_PAD;
          const length = Math.max(last.start + last.length - first.start - MARKER_PAD * 2, 0);
          return { start, length };
        })()
      : null;
  const railPath = geometry ? `M 1 ${geometry.top} L 1 ${geometry.top + geometry.total}` : "";

  return (
    <nav aria-label="Table of contents" className={cn("text-sm", className)} {...props}>
      <ul ref={listRef} className="relative">
        {geometry && (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            fill="none"
          >
            {/* The static rail. A drawn stroke rather than a `border`, so the marker below
                sits exactly on it at the same coordinates. */}
            <path d={railPath} className="stroke-border" strokeWidth={2} strokeLinecap="round" />
            {/* The marker: a single dash covering the visible range, slid into place. Round caps
                come from the stroke itself, so they never distort with length. */}
            <path
              d={railPath}
              className="stroke-foreground transition-[stroke-dasharray,stroke-dashoffset,opacity] duration-(--duration-base) ease-out"
              strokeWidth={2}
              strokeLinecap="round"
              style={{
                strokeDasharray: marker ? `${marker.length} ${geometry.total + 1}` : undefined,
                strokeDashoffset: marker ? -marker.start : undefined,
                opacity: marker ? 1 : 0,
              }}
            />
          </svg>
        )}
        {items.map((item) => {
          const active = visibleSet.has(item.id) || (visibleIds.length === 0 && item.id === currentId);
          return (
            <li key={item.id} data-toc-id={item.id} className="relative">
              <a
                href={`#${item.id}`}
                onClick={(event) => scrollTo(event, item.id)}
                aria-current={item.id === currentHighlightId ? "location" : undefined}
                style={{ paddingInlineStart: `${0.75 + ((item.level ?? 2) - minLevel) * 0.75}rem` }}
                className={cn(
                  "block py-1.5 pr-2 leading-snug transition-colors duration-(--duration-fast) ease-out",
                  "outline-none focus-visible:text-foreground",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
