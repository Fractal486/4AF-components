import { cn } from "@/registry/lib/cn";
import type { ReactNode } from "react";

/**
 * The three sizes, mirroring Button. `xs` (24px) is the dense control; `sm` (30px) is the
 * compact/toolbar default; `md` (34px) matches Button's `md` and the Input, so a select lines
 * up with them in a form row. The size flows through context so the trigger and option rows
 * scale together.
 */
export type SelectSize = "xs" | "sm" | "md";

export const SIZE: Record<
  SelectSize,
  { field: string; chip: string; chipIconOnly: string; glyph: string; iconSlot: string; row: string; radius: string }
> = {
  xs: {
    field: "h-6 text-xs",
    chip: "h-6 px-2.5 text-xs",
    chipIconOnly: "size-6 justify-center px-0 text-xs",
    glyph: "size-3.5",
    iconSlot: "size-3.5 [&_svg]:size-3.5 [&_[data-slot=loader]]:size-3.5",
    row: "h-6 min-h-6 py-1 text-xs",
    radius: "rounded-[6px]",
  },
  sm: {
    field: "h-[30px] text-xs",
    chip: "h-[30px] px-3 text-xs",
    chipIconOnly: "size-[30px] justify-center px-0 text-xs",
    glyph: "size-3.5",
    iconSlot: "size-3.5 [&_svg]:size-3.5 [&_[data-slot=loader]]:size-3.5",
    row: "min-h-[30px] text-xs",
    radius: "rounded-[6px]",
  },
  md: {
    field: "h-[34px] text-sm",
    chip: "h-[34px] px-3.5 text-sm",
    chipIconOnly: "size-[34px] justify-center px-0 text-sm",
    glyph: "size-4",
    iconSlot: "size-4 [&_svg]:size-4 [&_[data-slot=loader]]:size-4",
    row: "min-h-[34px] text-sm",
    radius: "rounded-[8px]",
  },
};


// The panel blurs and scales in from `--transform-origin`, and every select in the family
// uses these same numbers: 0.95 and a 3px blur entering, a shorter 0.97 and 2px leaving, over
// `--duration-base` on the expo curve. Three selects sat in one form that scale by different
// amounts is the kind of difference you feel without being able to name.
export const FADE_HIDDEN = { opacity: 0, scale: 0.95, filter: "blur(3px)" };

export const FADE_SHOW = { opacity: 1, scale: 1, filter: "blur(0px)" };

// Leaving is its own pose, not the entrance reversed: less travel and less blur, so the panel
// is gone before it can draw attention to going.
export const FADE_EXIT = { opacity: 0, scale: 0.97, filter: "blur(2px)" };


/**
 * The icon slot sizes *any* glyph inside it, not just a direct child: a row can hand it a
 * `Morph` that swaps between glyphs, which puts the svg a level down. A direct-child rule
 * would miss it and the icon would render at its intrinsic size.
 */
export function SelectItemIcon({ icon, size }: { icon?: ReactNode; size: SelectSize }) {
  if (icon == null) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none flex shrink-0 items-center justify-center",
        SIZE[size].iconSlot,
      )}
    >
      {icon}
    </span>
  );
}
