import { cva } from "class-variance-authority";

export const hoverCardPositionerVariants = cva("isolate z-50 outline-none");
export const hoverCardPopupVariants = cva([
  "flex min-h-0 min-w-0 flex-col w-72 max-w-[min(var(--available-width,100vw),calc(100vw-2rem))] max-h-[var(--available-height,calc(100dvh-2rem))]",
  "overflow-hidden rounded-md border border-border bg-surface p-4 text-sm wrap-anywhere text-foreground shadow-overlay-drop outline-none",
  "origin-[var(--transform-origin)] blur-0",
  // Height intentionally animates: loaded or expanded content should resize its surface.
  "transition-[opacity,scale,translate,filter,height] duration-(--duration-fast) ease-out",
  "data-resizing:[transition-property:opacity,scale,translate,filter]",
  // Hide only this panel's scrollbar while its height settles.
  "data-sizing:[&>[data-slot=hover-card-scroll-area]>[data-orientation]]:invisible data-resizing:[&>[data-slot=hover-card-scroll-area]>[data-orientation]]:invisible",
  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:blur-[4px]",
  "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[3px]",
  "data-[side=top]:data-[starting-style]:translate-y-2 data-[side=top]:data-[ending-style]:translate-y-1",
  "data-[side=bottom]:data-[starting-style]:-translate-y-2 data-[side=bottom]:data-[ending-style]:-translate-y-1",
  "data-[side=left]:data-[starting-style]:translate-x-2 data-[side=left]:data-[ending-style]:translate-x-1",
  "data-[side=right]:data-[starting-style]:-translate-x-2 data-[side=right]:data-[ending-style]:-translate-x-1",
  "motion-reduce:[transition-property:opacity,height] motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100",
  "motion-reduce:data-starting-style:translate-none motion-reduce:data-ending-style:translate-none motion-reduce:data-starting-style:blur-none motion-reduce:data-ending-style:blur-none",
]);
export const hoverCardSkeletonVariants = cva("flex min-w-0 gap-3");
