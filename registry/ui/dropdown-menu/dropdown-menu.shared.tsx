import { cn } from "@/registry/lib/cn";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";
import type { ReactElement, ReactNode } from "react";

export const itemBase = cn(
  // Compact rows: 12px text and 14px glyphs, a denser treatment than the 14px overlays.
  "relative flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs text-foreground outline-none select-none",
  // Instant — no transition, so the highlight tracks the keyboard rather than trailing it.
  "data-[highlighted]:bg-muted hover:bg-muted focus-visible:bg-muted data-[popup-open]:bg-muted",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  // Size/inert every glyph, but only mute the *leading* icons (direct children) — the
  // nested check/dot indicators keep the item's foreground ink.
  "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 [&>svg]:text-muted-foreground",
  // A morphing icon is a leading icon too, and the rule above misses it: `Morph` wraps
  // its content in a span, so the glyph is a grandchild and inherits the row's full-ink
  // `text-foreground` instead — one row's icon brighter than every other row's, for no
  // reason the user could name. Matching through a direct-child Morph puts it back.
  //
  // Still scoped to direct children, so the check and dot indicators are untouched: both
  // sit inside an absolutely positioned span, and they're meant to read at full ink.
  "[&>[data-slot=morph]_svg]:text-muted-foreground",
  // A Morph reserves the width of its widest state and centres inside it, which is right
  // for a button and wrong for a label here: in a left-aligned row the shorter label
  // would sit indented, so a toggling item looks misaligned in one state only.
  //
  // Direct children only, and that scoping is load-bearing. A Morph swapping *glyphs* in
  // a fixed icon slot must stay centred — the ASCII loader is a narrow character next to
  // 14px icons, and start-aligning it inside the slot they share drags it left of every
  // other row's icon. Labels are written inline as direct children; glyph Morphs are
  // wrapped in their slot, one level down, and keep Morph's own centring.
  "[&>[data-slot=morph]]:place-items-start",
);

/**
 * The tick/dot slot, and it holds the same 14px box a leading icon does — `left-2.5` and
 * `size-3.5` against the row's `px-2.5` padding, so both run 10px to 24px and share a
 * centre.
 *
 * It used to be `left-2 size-4`: 8px to 24px. The two boxes shared a right edge but not a
 * centre, so a ticked row's glyph sat a pixel left of an icon row's, which is exactly the
 * kind of drift you can see in a column of rows and can't name. The labels were always
 * fine — the row's `pl-8` is 10 + 14 + 8 — so only the glyph column was off.
 */
export const INDICATOR_SLOT =
  "pointer-events-none absolute left-2.5 flex size-3.5 items-center justify-center";

export function DisabledReasonTooltip({
  disabled,
  reason,
  children,
}: {
  disabled?: boolean;
  reason?: ReactNode;
  children: ReactElement;
}) {
  if (!disabled || reason == null || reason === "") return children;

  return (
    <Tooltip content={reason} side="right" sideOffset={6} delay={0}>
      {children}
    </Tooltip>
  );
}
