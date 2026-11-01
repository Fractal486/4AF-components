"use client";

import { useLayoutEffect, type RefObject } from "react";

const OPEN_TRIGGER = "[data-slot=menubar-trigger][data-popup-open]";

/**
 * Keeps the bar's highlight over whichever trigger has its menu open.
 *
 * Base UI marks the open trigger with `data-popup-open`; a MutationObserver watches for
 * that attribute moving, so the highlight follows pointer sweeps, arrow keys, and
 * controlled `open` alike. Positions are measured in the bar's scrolling content, so the
 * highlight scrolls with its trigger instead of being re-placed on every scroll event.
 */
export function useMenubarHighlight(
  barRef: RefObject<HTMLElement | null>,
  highlightRef: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    const bar = barRef.current;
    const highlight = highlightRef.current;
    if (!bar || !highlight) return;

    let current: HTMLElement | null = null;

    const openTrigger = () =>
      Array.from(bar.querySelectorAll<HTMLElement>(OPEN_TRIGGER)).find(
        // Skip triggers that belong to a menubar nested inside this one.
        (trigger) => trigger.closest("[data-slot=menubar]") === bar,
      ) ?? null;

    const measure = (trigger: HTMLElement) => {
      const frame = bar.getBoundingClientRect();
      const box = trigger.getBoundingClientRect();
      // Rects include any CSS transform on an ancestor (a zoomed preview, a scaling
      // dialog); the highlight lives in the bar's untransformed coordinates.
      const scale = bar.offsetWidth > 0 ? frame.width / bar.offsetWidth : 1;
      const x = (box.left - frame.left) / scale - bar.clientLeft + bar.scrollLeft;
      const y = (box.top - frame.top) / scale - bar.clientTop + bar.scrollTop;
      highlight.style.setProperty("--menubar-highlight-x", `${x}px`);
      highlight.style.setProperty("--menubar-highlight-y", `${y}px`);
      highlight.style.setProperty("--menubar-highlight-width", `${box.width / scale}px`);
      highlight.style.setProperty("--menubar-highlight-height", `${box.height / scale}px`);
    };

    /** Move without a transition, then restore transitions for the next change. */
    const placeInstantly = (trigger: HTMLElement, show: boolean) => {
      highlight.setAttribute("data-instant", "");
      measure(trigger);
      if (show) highlight.setAttribute("data-visible", "");
      // Commit the new values while transitions are off, so removing the attribute does
      // not animate to them.
      void highlight.offsetWidth;
      highlight.removeAttribute("data-instant");
    };

    // A label change, a font load, or the bar resizing moves triggers without moving the
    // open state. Follow without sliding.
    const resize = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          if (current) placeInstantly(current, false);
        });
    resize?.observe(bar);

    let hideFrame = 0;
    const hide = () => {
      hideFrame = 0;
      if (openTrigger()) return;
      current = null;
      highlight.removeAttribute("data-visible");
    };

    const sync = () => {
      // Observing an element twice is a no-op, so triggers added later are picked up here.
      for (const trigger of bar.querySelectorAll("[data-slot=menubar-trigger]")) resize?.observe(trigger);

      const trigger = openTrigger();
      if (!trigger) {
        // Switching menus can close the old one a commit before the new one opens. Wait a
        // frame before hiding, so the highlight slides between them instead of
        // disappearing and reappearing in place.
        if (current && !hideFrame) hideFrame = requestAnimationFrame(hide);
        return;
      }
      if (hideFrame) {
        cancelAnimationFrame(hideFrame);
        hideFrame = 0;
      }
      if (trigger === current) return;
      const appearing = current === null;
      current = trigger;
      if (appearing) placeInstantly(trigger, true);
      else measure(trigger);
    };

    sync();

    const mutations = new MutationObserver(sync);
    mutations.observe(bar, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-popup-open"],
    });

    return () => {
      mutations.disconnect();
      resize?.disconnect();
      cancelAnimationFrame(hideFrame);
    };
  }, [barRef, highlightRef]);
}
