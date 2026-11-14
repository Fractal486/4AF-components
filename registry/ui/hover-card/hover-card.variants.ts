import { cva } from "class-variance-authority";

export const hoverCardPositionerVariants = cva("isolate z-50 outline-none");
export const hoverCardPopupVariants = cva([
  "flex min-h-0 min-w-0 flex-col w-72 max-w-[min(var(--available-width,100vw),calc(100vw-2rem))] max-h-[var(--available-height,calc(100dvh-2rem))]",
  "overflow-hidden rounded-md border border-border material-glass p-4 text-sm wrap-anywhere text-foreground shadow-overlay-drop outline-none",
  "origin-[var(--transform-origin)] blur-0",
  // Height intentionally animates: loaded or expanded content should resize its surface.
  // The Select family's entrance and exit: 0.9 and 4px in over `--duration-slow` on
  // `--ease-panel`, 0.97 and 2px out over `--duration-base`. Height keeps its own quicker
  // timing, so a content resize settles at the old pace.
  "transition-[opacity,scale,filter,height] ease-panel [transition-duration:var(--duration-slow),var(--duration-slow),var(--duration-slow),var(--duration-fast)]",
  "data-[ending-style]:duration-(--duration-base) data-[ending-style]:ease-out",
  "data-resizing:[transition-property:opacity,scale,filter]",
  // Hide only this panel's scrollbar while its height settles.
  "data-sizing:[&>[data-slot=hover-card-scroll-area]>[data-orientation]]:invisible data-resizing:[&>[data-slot=hover-card-scroll-area]>[data-orientation]]:invisible",
  "data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[starting-style]:blur-[4px]",
  "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[2px]",
  "motion-reduce:[transition-property:opacity,height] motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100",
  "motion-reduce:data-starting-style:blur-none motion-reduce:data-ending-style:blur-none",
]);
export const hoverCardSkeletonVariants = cva("flex min-w-0 gap-3");
