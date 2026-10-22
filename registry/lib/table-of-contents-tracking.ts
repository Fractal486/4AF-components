"use client";

import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";

/** Fallback for browsers that do not emit `scrollend` after programmatic smooth scrolling. */
const SCROLL_SETTLE_DELAY = 120;

export interface TocTrackingItem {
  /** The `id` of the section (or heading) element an entry points at. */
  id: string;
}

export interface UseTableOfContentsTrackingOptions {
  items: readonly TocTrackingItem[];
  /** The scroll container, when the content scrolls inside an element rather than the page. */
  rootRef?: RefObject<HTMLElement | null>;
  /**
   * Where activation lands after a programmatic scroll settles. `pin` keeps the clicked row
   * active until the reader scrolls again; `release` hands back to live observation.
   */
  settle: "pin" | "release";
  /**
   * Track which headings intersect the viewport. Leave this off when only the active heading is
   * needed; that avoids the observer and its extra renders.
   */
  trackVisibility?: boolean;
  /**
   * Project which headings will be on screen at the clicked destination. This keeps a smooth
   * scroll from retargeting the active range at every heading it passes.
   */
  projectDestinationIds?: (target: HTMLElement, scrollRoot: HTMLElement | null) => string[];
}

export interface TableOfContentsTracking {
  /** Heading ids intersecting the viewport, in item order. Empty unless `trackVisibility`. */
  visibleIds: string[];
  /** The last heading whose top has passed the scroll position. */
  currentId: string | undefined;
  /** The destination while a programmatic scroll is in flight. */
  scrollTargetId: string | undefined;
  /** The destination after settling, until the next live scroll clears it. */
  settledTargetId: string | undefined;
  /** The projected destination span during flight. */
  scrollVisibleIds: string[];
  /** The leading destination heading during flight. */
  scrollCurrentId: string | undefined;
  scrollTo: (event: MouseEvent, id: string) => void;
}

/**
 * Shared tracking core for table-of-contents variants: cached heading offsets, visibility
 * observation, programmatic-scroll settling, listeners, and cleanup. Visual variants keep their
 * own geometry while receiving identical reader-navigation behavior.
 */
export function useTableOfContentsTracking({
  items,
  rootRef,
  settle,
  trackVisibility = false,
  projectDestinationIds,
}: UseTableOfContentsTrackingOptions): TableOfContentsTracking {
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string>();
  const [scrollTargetId, setScrollTargetId] = useState<string>();
  const [settledTargetId, setSettledTargetId] = useState<string>();
  const [scrollVisibleIds, setScrollVisibleIds] = useState<string[]>([]);
  const [scrollCurrentId, setScrollCurrentId] = useState<string>();
  const visible = useRef<Map<string, boolean>>(new Map());
  const scrollCleanupRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      scrollCleanupRef.current?.();
    },
    [],
  );

  const scrollTo = (event: MouseEvent, id: string) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const element = document.getElementById(id);
    if (!element) return;
    event.preventDefault();

    // While native smooth scrolling passes intermediate headings, keep the visual state locked to
    // the destination projection (or the current visible set when no projection is supplied).
    scrollCleanupRef.current?.();
    setScrollTargetId(id);
    setSettledTargetId(undefined);

    const scrollRootElement = rootRef?.current ?? null;
    const scrollRoot: HTMLElement | Window = scrollRootElement ?? window;
    const lockedVisibleIds = (() => {
      const projected = projectDestinationIds?.(element, scrollRootElement) ?? visibleIds;
      return projected.length > 0 ? projected : visibleIds;
    })();
    setScrollVisibleIds(lockedVisibleIds);
    setScrollCurrentId(lockedVisibleIds[0] ?? currentId);

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
      setSettledTargetId(settle === "pin" ? id : undefined);
      setScrollVisibleIds([]);
      setScrollCurrentId(undefined);
    };
    const scheduleFinish = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(finish, SCROLL_SETTLE_DELAY);
    };

    scrollRoot.addEventListener("scroll", scheduleFinish, { passive: true });
    scrollRoot.addEventListener("scrollend", finish, { once: true });
    scrollCleanupRef.current = cleanup;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    // Embedded webviews and test DOMs may not implement the native method. Tracking still applies,
    // so a missing scroll primitive is simply a no-op.
    element.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
    scheduleFinish();
  };

  // Cache heading offsets when layout changes, then use a binary search during scroll. The hot
  // path reads only scrollTop/scrollY: no per-heading layout reads and at most one state update
  // per animation frame.
  useEffect(() => {
    visible.current = new Map();
    const root = rootRef?.current ?? null;
    const elements = items.flatMap((item) => {
      const element = document.getElementById(item.id);
      return element ? [element] : [];
    });

    let positions: { id: string; top: number }[] = [];
    let frame = 0;
    // The scroll height the offsets above were measured against. Anything that changes it
    // — an image finishing, a font swapping, an embed sizing itself — moves every heading
    // below it, and none of that resizes the root or the headings themselves, so no
    // observer here would otherwise hear about it.
    let measuredScrollHeight = 0;

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

    const scrollHeight = () =>
      root?.scrollHeight ?? document.documentElement.scrollHeight;

    const measurePositions = () => {
      const viewportTop = root?.getBoundingClientRect().top ?? 0;
      const scrollOffset = root?.scrollTop ?? window.scrollY;
      positions = elements.map((element) => ({
        id: element.id,
        top: element.getBoundingClientRect().top - viewportTop + scrollOffset,
      }));
      measuredScrollHeight = scrollHeight();
      updateCurrentId();
    };

    const scheduleUpdate = () => {
      setSettledTargetId((current) => (current === undefined ? current : undefined));
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // One property read per frame, and it is what keeps a first read honest: measured
        // before the images land, every heading sits too high, so the list runs ahead of
        // the article and then snaps back as the real positions arrive.
        if (scrollHeight() !== measuredScrollHeight) {
          measurePositions();
          return;
        }
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
    // Capture, because `load` does not bubble. Without this the correction waits for the
    // next scroll, which is exactly when the reader is watching the list.
    const handleContentLoad = () => measurePositions();
    const loadTarget = root ?? document;
    loadTarget.addEventListener("load", handleContentLoad, true);
    measurePositions();

    const observer =
      trackVisibility && elements.length > 0 && typeof IntersectionObserver !== "undefined"
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
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measurePositions);
      loadTarget.removeEventListener("load", handleContentLoad, true);
      scrollTarget.removeEventListener("scroll", scheduleUpdate);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [items, rootRef, trackVisibility]);

  return {
    visibleIds,
    currentId,
    scrollTargetId,
    settledTargetId,
    scrollVisibleIds,
    scrollCurrentId,
    scrollTo,
  };
}
