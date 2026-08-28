"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

const TOC_SCROLL_EPSILON = 0.5;
const TOC_SCROLL_RESPONSE_MS = 80;

interface TocScrollAnimation {
  frame: number;
  lastTime: number;
  position: number;
  target: number;
}

interface TocEdgePadding {
  start: number;
  end: number;
}

const NO_EDGE_PADDING: TocEdgePadding = { start: 0, end: 0 };

/**
 * Adds just enough scrollable space before and after a constrained list for its endpoint rows to
 * reach the viewport centre. An unconstrained TOC stays compact — it has no reason to grow just
 * to create a scroll position that cannot be used.
 */
export function useTableOfContentsEdgePadding(
  navRef: RefObject<HTMLElement | null>,
  items: readonly unknown[],
): TocEdgePadding {
  const [padding, setPadding] = useState<TocEdgePadding>(NO_EDGE_PADDING);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const measure = () => {
      const rows = Array.from(nav.querySelectorAll<HTMLElement>("[data-toc-id]"));
      const hasOverflow = nav.scrollHeight > nav.clientHeight + TOC_SCROLL_EPSILON;
      const first = rows[0];
      const last = rows.at(-1);
      const next =
        hasOverflow && first && last
          ? {
              start: Math.max((nav.clientHeight - first.offsetHeight) / 2, 0),
              end: Math.max((nav.clientHeight - last.offsetHeight) / 2, 0),
            }
          : NO_EDGE_PADDING;
      setPadding((current) =>
        current.start === next.start && current.end === next.end ? current : next,
      );
    };

    measure();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(nav);
    for (const row of nav.querySelectorAll<HTMLElement>("[data-toc-id]")) observer?.observe(row);
    return () => observer?.disconnect();
  }, [items, navRef]);

  return padding;
}

/**
 * Reports which edges of a scrollable contents list have content beyond them. Consumers can use
 * the booleans for an optional fade or other overflow affordance without coupling the navigation
 * behavior to a particular visual treatment.
 */
export function useTableOfContentsEdgeFade(
  navRef: RefObject<HTMLElement | null>,
  items: readonly unknown[],
): { top: boolean; bottom: boolean } {
  const [edges, setEdges] = useState({ top: false, bottom: false });

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const measure = () => {
      const scrollable = nav.scrollHeight > nav.clientHeight + TOC_SCROLL_EPSILON;
      const next = {
        top: scrollable && nav.scrollTop > TOC_SCROLL_EPSILON,
        bottom:
          scrollable &&
          nav.scrollTop + nav.clientHeight < nav.scrollHeight - TOC_SCROLL_EPSILON,
      };
      setEdges((current) =>
        current.top === next.top && current.bottom === next.bottom ? current : next,
      );
    };

    measure();
    nav.addEventListener("scroll", measure, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(nav);
    for (const row of nav.querySelectorAll<HTMLElement>("[data-toc-id]")) observer?.observe(row);
    return () => {
      nav.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, [items, navRef]);

  return edges;
}

/**
 * Keeps an active contents row near the middle of its own scroll viewport.
 *
 * The document and contents list scroll independently. The caller supplies the document-derived
 * active id; this hook only moves the contents viewport. Retargeting an in-flight animation,
 * instead of restarting it for each heading, prevents the row from stuttering as the document
 * continues to scroll.
 */
export function useCenterActiveTableOfContentsItem(
  navRef: RefObject<HTMLElement | null>,
  activeId: string | undefined,
  items: readonly unknown[],
  layoutVersion?: unknown,
) {
  const animationRef = useRef<TocScrollAnimation | null>(null);

  useEffect(
    () => () => {
      const animation = animationRef.current;
      if (animation) window.cancelAnimationFrame(animation.frame);
      animationRef.current = null;
    },
    [navRef],
  );

  useLayoutEffect(() => {
    const nav = navRef.current;
    const cancelAnimation = () => {
      const animation = animationRef.current;
      if (animation) window.cancelAnimationFrame(animation.frame);
      animationRef.current = null;
    };

    if (!nav || !activeId) {
      cancelAnimation();
      return;
    }

    const rows = Array.from(nav.querySelectorAll<HTMLElement>("[data-toc-id]"));
    const activeIndex = rows.findIndex((row) => row.dataset.tocId === activeId);
    const activeRow = rows[activeIndex];
    if (!activeRow) {
      cancelAnimation();
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const rowRect = activeRow.getBoundingClientRect();
    const rowCenter = rowRect.top + rowRect.height / 2;
    const viewportCenter = navRect.top + nav.clientHeight / 2;
    const desiredScrollTop = nav.scrollTop + rowCenter - viewportCenter;
    const maxScrollTop = Math.max(nav.scrollHeight - nav.clientHeight, 0);
    // At either end there is no room to centre the row. Make those targets explicit rather than
    // deriving them from a viewport measurement while the rail is already scrolled: a return to
    // the document's first section must bring the first contents row back into view.
    const nextScrollTop =
      activeIndex === 0
        ? 0
        : activeIndex === rows.length - 1
          ? maxScrollTop
          : Math.min(Math.max(desiredScrollTop, 0), maxScrollTop);

    if (!Number.isFinite(nextScrollTop)) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduceMotion || typeof window.requestAnimationFrame !== "function") {
      cancelAnimation();
      nav.scrollTop = nextScrollTop;
      return;
    }

    const currentAnimation = animationRef.current;
    if (currentAnimation) {
      currentAnimation.target = nextScrollTop;
      currentAnimation.position = nav.scrollTop;
      return;
    }

    if (Math.abs(nextScrollTop - nav.scrollTop) < TOC_SCROLL_EPSILON) return;

    const animation: TocScrollAnimation = {
      frame: 0,
      lastTime: window.performance?.now() ?? Date.now(),
      position: nav.scrollTop,
      target: nextScrollTop,
    };
    const animate = (time: number) => {
      if (animationRef.current !== animation) return;

      const elapsed = Math.min(Math.max(time - animation.lastTime, 0), 64);
      animation.lastTime = time;
      const distance = animation.target - animation.position;
      if (Math.abs(distance) <= TOC_SCROLL_EPSILON) {
        nav.scrollTop = animation.target;
        animationRef.current = null;
        return;
      }

      const progress = 1 - Math.exp(-elapsed / TOC_SCROLL_RESPONSE_MS);
      animation.position += distance * progress;
      nav.scrollTop = animation.position;
      animation.frame = window.requestAnimationFrame(animate);
    };

    animationRef.current = animation;
    animation.frame = window.requestAnimationFrame(animate);
  }, [activeId, items, layoutVersion, navRef]);
}
