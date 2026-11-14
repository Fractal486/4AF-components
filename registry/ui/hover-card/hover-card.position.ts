"use client";

import { useCallback, useState } from "react";
import type { PreviewCard } from "@base-ui/react/preview-card";

type Side = NonNullable<PreviewCard.Positioner.Props["side"]>;

/** Lock only after Base UI has resolved the initial collision. Visibility/dismissal remain
 * Base UI's; observing its attributes also handles controlled roots and kept-mounted cards. */
export function useHoverCardSideLock(preferredSide: Side, enabled: boolean) {
  const [lock, setLock] = useState<{ preferredSide: Side; side: Side } | null>(null);
  const ref = useCallback((positioner: HTMLDivElement | null) => {
    if (!positioner || !enabled) return;
    let frame = 0;
    let settled = false;
    const update = () => {
      if (!positioner.hasAttribute("data-open")) {
        cancelAnimationFrame(frame);
        frame = 0;
        settled = false;
        setLock(null);
        return;
      }
      if (settled || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!positioner.hasAttribute("data-open") || positioner.style.visibility === "hidden") return;
        const side = positioner.getAttribute("data-side") as Side | null;
        if (!side) return;
        settled = true;
        setLock({ preferredSide, side });
      });
    };
    const observer = new MutationObserver(update);
    observer.observe(positioner, { attributes: true, attributeFilter: ["data-open", "data-side", "style"] });
    update();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      setLock(null);
    };
  }, [preferredSide, enabled]);

  return {
    ref,
    lockedSide: enabled && lock?.preferredSide === preferredSide ? lock.side : undefined,
  };
}
