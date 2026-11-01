import { cva } from "class-variance-authority";

/**
 * The right-click / long-press area. It has no look of its own: the caller styles the area,
 * and the trigger adds only the touch hold feedback.
 *
 * While a long press is held, the area shrinks to 0.98 so the press reads as registered
 * before Base UI opens the menu at 500ms. It eases back when the finger lifts, moves, or the
 * menu opens. `scale` is the only property named, so it composes with the caller's styling;
 * a caller that sets its own transition list should include `scale`.
 */
export const contextMenuTriggerVariants = cva([
  // iOS shows its own callout on a long press, which would cover the menu.
  "[-webkit-touch-callout:none]",
  "transition-[scale] duration-(--duration-slow) ease-out",
  "data-[holding]:not-data-[popup-open]:scale-[0.98] motion-reduce:data-[holding]:scale-100",
]);
