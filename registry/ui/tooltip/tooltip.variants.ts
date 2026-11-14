import { cva } from "class-variance-authority";

export const tooltipPositionerVariants = cva("z-50 max-w-(--available-width) outline-none");

export const tooltipPopupVariants = cva([
  // The glass material every floating panel shares.
  "w-fit max-w-[min(var(--container-xs),var(--available-width))] wrap-anywhere rounded-md material-glass px-2.5 py-1",
  "text-xs font-medium text-pretty text-foreground",
  // A faint ring and soft lift shared by transient floating annotations.
  "shadow-overlay-subtle",
  // Scale grows from the anchor side; `blur-0` is the resting filter so it interpolates
  // from blur(5px) rather than from `none`, which some browsers won't tween. Only these
  // properties change, so only these are named. Base UI holds the popup mounted through
  // the transition and unmounts on transitionend; its `data-instant` state short-circuits
  // that transition when the provider moves directly between neighbouring triggers.
  "origin-[var(--transform-origin)] blur-0",
  "transition-[opacity,scale,translate,filter] duration-(--duration-fast) ease-out data-instant:transition-none",
  // Hidden pose: fade, shrink, blur — and slide in from *toward* the trigger, so a top
  // tooltip rises up from below into place rather than only scaling. Larger offset
  // entering than leaving.
  "data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[starting-style]:blur-[5px]",
  "data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:blur-[3px]",
  "data-[side=top]:data-[starting-style]:translate-y-4 data-[side=top]:data-[ending-style]:translate-y-1",
  "data-[side=bottom]:data-[starting-style]:-translate-y-4 data-[side=bottom]:data-[ending-style]:-translate-y-1",
  "data-[side=left]:data-[starting-style]:translate-x-4 data-[side=left]:data-[ending-style]:translate-x-1",
  "data-[side=right]:data-[starting-style]:-translate-x-4 data-[side=right]:data-[ending-style]:-translate-x-1",
]);
