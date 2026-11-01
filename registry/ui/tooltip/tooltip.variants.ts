import { cva } from "class-variance-authority";

export const tooltipPositionerVariants = cva("z-50 max-w-(--available-width) outline-none");

export const tooltipPopupVariants = cva([
  // `bg-surface`: the same fill as an outline button at rest, so the tooltip reads as
  // the same material as the control it describes.
  "w-fit max-w-[min(var(--container-xs),var(--available-width))] wrap-anywhere rounded-md bg-surface px-2.5 py-1",
  "text-xs font-medium text-pretty text-foreground",
  // A single faint 1px ring instead of shadow-overlay's heavier one, plus a soft drop
  // shadow. rgba, not oklch, so the `/` alpha can't trip Tailwind's arbitrary parser.
  "shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_10px_24px_-8px_rgba(0,0,0,0.18)]",
  "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_14px_30px_-12px_rgba(0,0,0,0.6)]",
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
