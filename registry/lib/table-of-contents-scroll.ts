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
 * Reports which edges of a scrollable contents list have content beyond them. Both contents
 * lists put the result on their nav as `data-overflow-top` / `data-overflow-bottom`, which
 * `TABLE_OF_CONTENTS_EDGE_FADE` turns into a fade.
 */
/**
 * Fades a contents list's edge while there is more beyond it, and keeps it sharp where the list
 * ends: a list that fits, or one scrolled to its top, doesn't grey its first row out for nothing.
 *
 * A mask rather than a gradient overlay: the nav is the scroll container, so an overlay inside it
 * would scroll away with the rows, and one outside it would have to know the background behind
 * the list to fake the fade. A mask stays pinned to the viewport edges over whatever is behind.
 *
 * The two ends crossfade because the theme registers `--toc-fade-top` / `--toc-fade-bottom` as
 * colours; untyped, the fade would snap on at the scroll threshold, a flicker on a list short
 * enough to cross it repeatedly. The duration is the token, so reduced motion keeps the fade
 * and drops only the crossfade.
 */
export const TABLE_OF_CONTENTS_EDGE_FADE = [
  "[--toc-fade-size:1.75rem] [--toc-fade-top:black] [--toc-fade-bottom:black]",
  "data-overflow-top:[--toc-fade-top:transparent] data-overflow-bottom:[--toc-fade-bottom:transparent]",
  // Both spellings: some WebKit versions honour only the prefixed property.
  "[-webkit-mask-image:linear-gradient(to_bottom,var(--toc-fade-top)_0,black_var(--toc-fade-size),black_calc(100%_-_var(--toc-fade-size)),var(--toc-fade-bottom)_100%)]",
  "[mask-image:linear-gradient(to_bottom,var(--toc-fade-top)_0,black_var(--toc-fade-size),black_calc(100%_-_var(--toc-fade-size)),var(--toc-fade-bottom)_100%)]",
  "transition-[--toc-fade-top,--toc-fade-bottom] duration-(--duration-base) ease-out",
].join(" ");

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
 * Keeps the active contents rows near the middle of their own scroll viewport.
 *
 * The document and contents list scroll independently. The caller supplies the document-derived
 * active id, or every id in a highlighted range (`span`), and the hook centres the whole range
 * rather than its first row. A range taller than the viewport shows its start instead. This hook
 * only moves the contents viewport. Retargeting an in-flight animation,
 * instead of restarting it for each heading, prevents the row from stuttering as the document
 * continues to scroll.
 */
export function useCenterActiveTableOfContentsItem(
  navRef: RefObject<HTMLElement | null>,
  active: string | readonly string[] | undefined,
  items: readonly unknown[],
  layoutVersion?: unknown,
) {
  const animationRef = useRef<TocScrollAnimation | null>(null);
  // A key rather than the array, so a range rebuilt on every render doesn't retarget the scroll.
  const activeKey = typeof active === "string" ? active : (active ?? []).join("\u0000");

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

    const activeIds = new Set(activeKey ? activeKey.split("\u0000") : []);
    const rows = Array.from(nav?.querySelectorAll<HTMLElement>("[data-toc-id]") ?? []);
    const firstIndex = rows.findIndex((row) => activeIds.has(row.dataset.tocId ?? ""));
    const lastIndex = rows.findLastIndex((row) => activeIds.has(row.dataset.tocId ?? ""));
    const firstRow = rows[firstIndex];
    const lastRow = rows[lastIndex];
    if (!nav || !firstRow || !lastRow) {
      cancelAnimation();
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const firstRect = firstRow.getBoundingClientRect();
    const lastRect = lastRow.getBoundingClientRect();
    const rangeTop = firstRect.top;
    const rangeBottom = lastRect.top + lastRect.height;
    // Centre the range; one taller than the viewport would lose its start, so lead with that.
    const rangeOffset =
      rangeBottom - rangeTop > nav.clientHeight
        ? rangeTop - navRect.top
        : (rangeTop + rangeBottom) / 2 - (navRect.top + nav.clientHeight / 2);
    const desiredScrollTop = nav.scrollTop + rangeOffset;
    const maxScrollTop = Math.max(nav.scrollHeight - nav.clientHeight, 0);
    // At either end there is no room to centre the range. Make those targets explicit rather than
    // deriving them from a viewport measurement while the rail is already scrolled: a return to
    // the document's first section must bring the first contents row back into view.
    const nextScrollTop =
      firstIndex === 0
        ? 0
        : lastIndex === rows.length - 1
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
  }, [activeKey, items, layoutVersion, navRef]);
}
