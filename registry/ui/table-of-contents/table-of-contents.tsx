"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/registry/lib/cn";
import { spring } from "@/registry/lib/motion";

/**
 * A table of contents that tracks the reader.
 *
 * Give it the headings (`{ id, title, level }`) and it lights *every entry whose section is
 * on screen* — an `IntersectionObserver` watches each section, so when three are in view all
 * three are lit, not just the top one. The rail marker **spans** that visible range: it
 * grows, shrinks and slides to cover exactly the lit entries.
 *
 * Because the marker mirrors what's actually visible rather than a clicked target, it stays
 * in lockstep with the scroll — no racing ahead of a smooth scroll and stuttering back. The
 * span is a transform-only animation (one element, off the layout path). Clicking an
 * entry scrolls its heading to the top (smoothly, or instantly under reduced motion).
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

export function TableOfContents({ items, rootRef, className, ...props }: TableOfContentsProps) {
  const reduceMotion = useReducedMotion();
  const listRef = useRef<HTMLUListElement>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [marker, setMarker] = useState<{ y: number; height: number } | null>(null);
  const minLevel = useMemo(
    () => (items.length ? Math.min(...items.map((item) => item.level ?? 2)) : 2),
    [items],
  );
  const visible = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    visible.current = new Map();
    const root = rootRef?.current ?? null;
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el != null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.current.set(entry.target.id, entry.isIntersecting);
        // Every section currently touching the viewport, in document order.
        setVisibleIds(items.filter((item) => visible.current.get(item.id)).map((item) => item.id));
      },
      { root, threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items, rootRef]);

  // The marker covers the first through last lit entry. Measured from the list layout (not
  // the scroll), so it only moves when the visible *set* changes.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || visibleIds.length === 0) {
      setMarker(null);
      return;
    }
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-toc-id]")).filter((row) =>
      visibleIds.includes(row.dataset.tocId ?? ""),
    );
    if (rows.length === 0) {
      setMarker(null);
      return;
    }
    const first = rows[0]!;
    const last = rows[rows.length - 1]!;
    const pad = 4;
    setMarker({
      y: first.offsetTop + pad,
      height: last.offsetTop + last.offsetHeight - first.offsetTop - pad * 2,
    });
  }, [visibleIds]);

  const scrollTo = (event: React.MouseEvent, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  const currentId = visibleIds[0];

  return (
    <nav aria-label="Table of contents" className={cn("text-sm", className)} {...props}>
      <ul ref={listRef} className="relative border-l border-border">
        {marker && (
          <motion.span
            aria-hidden
            className="absolute top-0 -left-px w-0.5 rounded-full bg-foreground"
            initial={false}
            style={{ height: 1, transformOrigin: "top" }}
            animate={{ y: marker.y, scaleY: marker.height }}
            transition={reduceMotion ? { duration: 0 } : spring.snappy}
          />
        )}
        {items.map((item) => {
          const active = visibleIds.includes(item.id);
          return (
            <li key={item.id} data-toc-id={item.id} className="relative">
              <a
                href={`#${item.id}`}
                onClick={(event) => scrollTo(event, item.id)}
                aria-current={item.id === currentId ? "location" : undefined}
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
