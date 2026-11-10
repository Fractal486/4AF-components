"use client";

import { pixels } from "@/registry/lib/numbers";
import { useCallback } from "react";

const trackingWindow = 80;
const milliseconds = (value: string) => (Number.parseFloat(value) || 0) * (value.trim().endsWith("ms") ? 1 : 1000);

function heightTransitionTime(style: CSSStyleDeclaration) {
  const durations = style.transitionDuration.split(",").map(milliseconds);
  const delays = style.transitionDelay.split(",").map(milliseconds);
  return Math.max(0, ...style.transitionProperty.split(",").map((property, index) =>
    property.trim() === "height" || property.trim() === "all"
      ? (durations[index % durations.length] ?? 0) + (delays[index % delays.length] ?? 0)
      : 0));
}

/** Observe natural content, never the constrained viewport, so shrinking cannot get stuck.
 * CSS owns the animation and reduced-motion tokens; continuous changes follow immediately. */
export function usePopupHeight(frameSelector: string) {
  return useCallback((sizer: HTMLDivElement | null) => {
    const popup = sizer?.closest<HTMLElement>(frameSelector);
    if (!sizer || !popup || typeof ResizeObserver === "undefined") return;
    const previousHeight = popup.style.height;
    let measuredHeight: string | undefined;
    let lastContentHeight: number | undefined;
    let lastChange = -Infinity;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let sizingFallback: ReturnType<typeof setTimeout> | undefined;
    const finishSizing = () => {
      clearTimeout(sizingFallback);
      delete popup.dataset.sizing;
    };
    const onHeightEnd = (event: TransitionEvent) => {
      if (event.target !== popup || event.propertyName !== "height") return;
      // Retargeting cancels the old transition. Keep the bar hidden until the new
      // height settles, rather than flashing it between two resize targets.
      if (Math.abs(pixels(getComputedStyle(popup).height) - pixels(measuredHeight ?? "")) < 1) finishSizing();
    };
    popup.addEventListener("transitionend", onHeightEnd);
    popup.addEventListener("transitioncancel", onHeightEnd);

    const measure = () => {
      // A kept-mounted, closed popup is display:none. Preserve its last real measurement.
      if (!popup.getClientRects().length) return;
      const style = getComputedStyle(popup);
      const contentHeight = sizer.offsetHeight;
      const chrome = pixels(style.paddingTop) + pixels(style.paddingBottom)
        + pixels(style.borderTopWidth) + pixels(style.borderBottomWidth);
      const natural = contentHeight + chrome;
      const max = Number.parseFloat(style.maxHeight);
      const height = Number.isFinite(max) ? Math.min(natural, max) : natural;
      // CSS height is normally border-box; preserve consumers using content-box too.
      const next = `${Math.max(0, height - (style.boxSizing === "content-box" ? chrome : 0))}px`;
      if (contentHeight !== lastContentHeight) {
        const now = performance.now();
        if (now - lastChange < trackingWindow) popup.dataset.resizing = "";
        lastChange = now;
        lastContentHeight = contentHeight;
        clearTimeout(settle);
        settle = setTimeout(() => { delete popup.dataset.resizing; }, trackingWindow);
      }
      if (next === measuredHeight) return;
      const transitionTime = heightTransitionTime(getComputedStyle(popup));
      if (measuredHeight !== undefined && transitionTime > 0 && !popup.hasAttribute("data-resizing")) {
        popup.dataset.sizing = "";
        clearTimeout(sizingFallback);
        // Fallback for a skipped/cancelled transition; actual transitionend clears it
        // sooner. Read computed timing so custom speed and reduced-motion tokens work.
        sizingFallback = setTimeout(finishSizing, transitionTime + 50);
      } else {
        finishSizing();
      }
      measuredHeight = next;
      popup.style.height = next;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(sizer);
    // Also re-clamp when available space changes, even if the content did not resize.
    observer.observe(popup);
    // Floating positioning updates available-height without necessarily resizing a panel
    // that is still held at its previous inline height (for example after viewport growth).
    const positioner = popup.parentElement;
    const availableSpace = new MutationObserver(measure);
    if (positioner) availableSpace.observe(positioner, { attributes: true, attributeFilter: ["style"] });
    measure();
    return () => {
      observer.disconnect();
      availableSpace.disconnect();
      clearTimeout(settle);
      finishSizing();
      popup.removeEventListener("transitionend", onHeightEnd);
      popup.removeEventListener("transitioncancel", onHeightEnd);
      delete popup.dataset.resizing;
      if (popup.style.height === measuredHeight) popup.style.height = previousHeight;
    };
  }, [frameSelector]);
}
