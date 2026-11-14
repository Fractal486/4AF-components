"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import {
  useCenterActiveTableOfContentsItem,
  useTableOfContentsEdgeFade,
  useTableOfContentsEdgePadding,
} from "@/registry/lib/table-of-contents-scroll";
import { useTableOfContentsTracking } from "@/registry/lib/table-of-contents-tracking";
import {
  tableOfContentsVariants,
  type TableOfContentsVariants,
} from "./table-of-contents.variants";

/**
 * A table of contents that tracks the reader.
 *
 * Give it the headings (`{ id, title, level }`) and it tracks which ones are currently on screen.
 * The default `span` variant lights every visible entry and spans the rail marker across their
 * range. The `single` variant keeps both the marker and active label on the first visible heading.
 * When ordinary prose leaves the viewport with no heading intersecting, both variants fall back
 * to the last section whose heading has been passed.
 *
 * The marker is an SVG stroke on a straight rail: its visible length is a dash
 * (`stroke-dasharray`/`stroke-dashoffset`) covering the selected range, animated with a single CSS
 * transition. `stroke-linecap="round"` gives true rounded caps at any length — no `scaleY`
 * stretching a corner radius — and because it's CSS, reduced motion collapses the `--duration-*`
 * token to 1ms for free.
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

export interface TableOfContentsProps
  extends Omit<ComponentProps<"nav">, "children">,
    TableOfContentsVariants {
  items: TocItem[];
  /** The scroll container, when the content scrolls inside an element rather than the page. */
  rootRef?: RefObject<HTMLElement | null>;
  /**
   * Highlights this entry regardless of scroll position, for a list whose headings are
   * elsewhere or not on the page at all (a preview, a static illustration). Clicks still scroll.
   */
  activeId?: string;
}

/** Inset (px) so the marker's rounded ends sit inside lit rows rather than on their edges. */
const MARKER_PAD = 4;

interface RailGeometry {
  /** Y of the rail's top (the first entry's top), in the SVG's pixel coordinates. */
  top: number;
  /** Rail length in pixels — the full span from the first entry's top to the last's bottom. */
  total: number;
  /** Per-entry range along the rail, keyed by id. `start` is measured from `top`. */
  segments: { id: string; start: number; length: number }[];
}

export function TableOfContents({
  items,
  rootRef,
  activeId,
  variant = "span",
  labels = "always",
  className,
  ref,
  ...props
}: TableOfContentsProps) {
  const navRef = useRef<HTMLElement>(null);
  const mergedRef = useMergedRefs(navRef, ref);
  const listRef = useRef<HTMLUListElement>(null);
  const [geometry, setGeometry] = useState<RailGeometry | null>(null);
  const minLevel = useMemo(
    () => (items.length ? Math.min(...items.map((item) => item.level ?? 2)) : 2),
    [items],
  );
  const { visibleIds, currentId, scrollTargetId, settledTargetId, scrollVisibleIds, scrollCurrentId, scrollTo } =
    useTableOfContentsTracking({
      items,
      rootRef,
      settle: variant === "single" ? "pin" : "release",
      trackVisibility: true,
      projectDestinationIds:
        variant === "span"
          ? (element, scrollRootElement) => {
              const viewportHeight = scrollRootElement?.clientHeight ?? window.innerHeight;
              if (viewportHeight <= 0) return [];

              const viewportTop = scrollRootElement?.getBoundingClientRect().top ?? 0;
              const scrollOffset = scrollRootElement?.scrollTop ?? window.scrollY;
              const targetRect = element.getBoundingClientRect();
              const targetOffset = targetRect.top - viewportTop + scrollOffset;
              const scrollMarginTop =
                Number.parseFloat(window.getComputedStyle(element).scrollMarginTop) || 0;
              const desiredScrollTop = Math.max(targetOffset - scrollMarginTop, 0);
              const maxScrollTop = scrollRootElement
                ? Math.max(scrollRootElement.scrollHeight - viewportHeight, 0)
                : Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
              const destinationTop = Math.min(desiredScrollTop, maxScrollTop);
              const destinationBottom = destinationTop + viewportHeight;

              return items.flatMap((item) => {
                const heading = document.getElementById(item.id);
                if (!heading) return [];
                const rect = heading.getBoundingClientRect();
                const top = rect.top - viewportTop + scrollOffset;
                const height = Math.max(rect.height || 1, 1);
                return top < destinationBottom && top + height > destinationTop ? [item.id] : [];
              });
            }
          : undefined,
    });

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

  // A clicked destination temporarily wins over live observation. `single` follows the destination;
  // `span` follows the projected destination range, so neither variant retargets at every heading.
  const trackingVisibleIds = activeId !== undefined
    ? [activeId]
    : scrollTargetId && variant === "span" ? scrollVisibleIds : visibleIds;
  const trackingCurrentId = activeId ??
    (scrollTargetId && variant === "span" ? scrollCurrentId : currentId);
  const visibleSet = new Set(trackingVisibleIds);
  const litSegments = geometry?.segments.filter((segment) => visibleSet.has(segment.id)) ?? [];
  const currentSegment = geometry?.segments.find((segment) => segment.id === trackingCurrentId);
  const currentHighlightId =
    activeId ?? (variant === "single"
      ? scrollTargetId ?? settledTargetId ?? visibleIds[0] ?? currentId
      : trackingVisibleIds[0] ?? trackingCurrentId);
  const singleSegment = geometry?.segments.find((segment) => segment.id === currentHighlightId);
  const markerSegments =
    variant === "single"
      ? singleSegment
        ? [singleSegment]
        : []
      : litSegments.length > 0
        ? litSegments
        : currentSegment
          ? [currentSegment]
          : [];
  const markerRange =
    markerSegments.length > 0
      ? (() => {
          const first = markerSegments[0]!;
          const last = markerSegments[markerSegments.length - 1]!;
          const start = first.start + MARKER_PAD;
          const length = Math.max(last.start + last.length - first.start - MARKER_PAD * 2, 0);
          return { start, length };
        })()
      : null;
  const marker = markerRange;
  const railPath = geometry
    ? `M 1 ${geometry.top + MARKER_PAD} L 1 ${geometry.top + geometry.total - MARKER_PAD}`
    : "";
  const markerPath = geometry ? `M 1 ${geometry.top} L 1 ${geometry.top + geometry.total}` : "";
  const edgePadding = useTableOfContentsEdgePadding(navRef, items);
  const edgeFade = useTableOfContentsEdgeFade(navRef, items);

  // `span` centres its whole lit range, not the first heading in it.
  useCenterActiveTableOfContentsItem(
    navRef,
    variant === "span" && markerSegments.length > 0
      ? markerSegments.map((segment) => segment.id)
      : currentHighlightId,
    items,
    edgePadding,
  );

  return (
    <nav
      ref={mergedRef}
      aria-label="Table of contents"
      data-variant={variant}
      data-overflow-top={edgeFade.top || undefined}
      data-overflow-bottom={edgeFade.bottom || undefined}
      className={cn(tableOfContentsVariants({ variant, labels }), className)}
      {...props}
    >
      <ul
        ref={listRef}
        className="relative"
        style={{ paddingBlockStart: edgePadding.start, paddingBlockEnd: edgePadding.end }}
      >
        {geometry && (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            fill="none"
          >
            {/* The static rail. A dashed stroke rather than a `border`, so the solid marker below
                sits exactly on it at the same coordinates. */}
            <path
              d={railPath}
              className="stroke-border"
              strokeWidth={1}
              strokeLinecap="round"
              strokeDasharray="3 3"
            />
            {/* The marker: a single dash covering the selected range, slid into place. Round caps
                come from the stroke itself, so they never distort with length. */}
            <path
              d={markerPath}
              className="stroke-foreground transition-[stroke-dasharray,stroke-dashoffset,opacity] duration-(--duration-slower) ease-out"
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
          const active =
            variant === "single"
              ? item.id === currentHighlightId
              : visibleSet.has(item.id) ||
                (trackingVisibleIds.length === 0 && item.id === trackingCurrentId);
          return (
            <li key={item.id} data-toc-id={item.id} className="relative">
              <a
                href={`#${item.id}`}
                onClick={(event) => scrollTo(event, item.id)}
                aria-current={item.id === currentHighlightId ? "location" : undefined}
                style={{ paddingInlineStart: `${0.75 + ((item.level ?? 2) - minLevel) * 0.75}rem` }}
                className={cn(
                  // The arrow cursor, like the library's other rows: the entry moves within
                  // the page rather than leaving it.
                  "block cursor-default py-1.5 pr-2 leading-snug duration-(--duration-slow) ease-out",
                  "outline-none focus-visible:text-foreground",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  labels === "hover"
                    ? cn(
                        // Only the paint is withheld: the entry keeps its box, so the rail
                        // and its marker — both measured from these rows — are drawn
                        // against the same geometry whether the headings are showing or
                        // not.
                        "opacity-0 -translate-x-1",
                        "transition-[color,opacity,translate]",
                        "group-hover/toc:translate-x-0 group-hover/toc:opacity-100",
                        // `:has(:focus-visible)`, not `:focus-within`: clicking an entry
                        // focuses it, and focus-within would then hold the whole list open
                        // after the pointer had left. `focus-visible` is not set by a
                        // mouse press, so only the keyboard keeps them up.
                        "group-has-[:focus-visible]/toc:translate-x-0 group-has-[:focus-visible]/toc:opacity-100",
                        // Nothing hovers on a touch screen, so there the headings stay.
                        "pointer-coarse:translate-x-0 pointer-coarse:opacity-100",
                      )
                    : "transition-colors",
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
