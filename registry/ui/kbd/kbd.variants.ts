import { cva } from "class-variance-authority";

export const kbdVariants = cva(
  // A translucent lift keeps the same keycap readable on menus, buttons, and panels.
  [
    "inline-flex shrink-0 items-center justify-center gap-0.5 rounded-xs bg-foreground/8 py-0.5 align-middle font-mono whitespace-nowrap text-subtle-foreground select-none [&_svg]:shrink-0",
    // Default icons follow the text; explicit size/width/height classes keep their sizing.
    "[&_svg:not([class*=size-]):not([class*=w-]):not([class*=h-])]:size-[1em]",
    "in-[button]:bg-current/10 in-[button]:text-inherit in-data-[slot=button]:bg-current/10 in-data-[slot=button]:text-inherit",
    "in-data-highlighted:bg-surface in-data-highlighted:text-inherit in-data-panel-active:bg-surface in-data-panel-active:text-inherit in-data-frozen:bg-surface in-data-frozen:text-inherit",
    "in-data-[slot=tooltip-content]:bg-current/10 in-data-[slot=tooltip-content]:text-inherit",
  ],
  {
    variants: {
      size: {
        sm: "min-w-4 px-1 text-2xs",
        md: "min-w-5 px-1.5 text-xs",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

export const kbdGroupVariants = cva("inline-flex items-center gap-1 align-middle", {
  variants: { size: { sm: "text-2xs", md: "text-xs" } },
  defaultVariants: { size: "sm" },
});
