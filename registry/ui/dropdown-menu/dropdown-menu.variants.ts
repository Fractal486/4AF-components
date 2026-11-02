import { cva } from "class-variance-authority";

export const dropdownMenuItemVariants = cva([
  // Compact rows: 12px text and 14px glyphs, a denser treatment than the 14px overlays.
  "relative flex min-w-0 items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs wrap-anywhere text-foreground outline-none select-none",
  // Instant — no transition, so the highlight tracks the keyboard rather than trailing it.
  "data-[highlighted]:bg-muted hover:bg-muted focus-visible:bg-muted data-[popup-open]:bg-muted",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  // Size/inert every glyph, but only mute the *leading* icons (direct children) — the
  // nested check/dot indicators keep the item's foreground ink.
  "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 [&>svg]:text-muted-foreground",
  // A loader takes the glyphs' 14px box. Its own `1em` is the row's 12px text, so a
  // spinner replacing an icon would shrink.
  "[&_[data-slot=loader]]:size-3.5",
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
  "[&>*]:min-w-0 [&>[data-slot=morph]]:max-w-full [&>[data-slot=morph]>*]:min-w-0 [&>[data-slot=morph]>*]:max-w-full [&>[data-slot=morph]>*]:whitespace-normal",
]);

export const dropdownMenuPopupVariants = cva([
  // Same floating-panel material as the Select/Popover panels.
  // The popup clips and `MenuScroll` scrolls, so the rows' `p-1` inset scrolls with them.
  "z-50 flex max-h-[var(--available-height)] min-w-[min(12.5rem,var(--available-width,calc(100vw-1rem)))] max-w-[min(20rem,var(--available-width,calc(100vw-1rem)))] flex-col overflow-hidden rounded-md border border-border bg-surface text-foreground shadow-overlay-drop outline-none",
  // Scale-and-blur enter from the trigger edge; only these properties change, so only
  // these are named. Base UI unmounts on transitionend, which fires because it's set.
  //
  // The Select family's numbers exactly — 0.9 and 4px in over `--duration-slow` on
  // `--ease-panel`, 0.97 and 2px out over `--duration-base`. A menu and a select panel are the same object to a user: a list of
  // choices hanging off a control, often sat next to each other in the same toolbar. Two
  // lists that open at different speeds is a difference you feel without being able to name.
  "origin-[var(--transform-origin)] blur-0",
  "transition-[opacity,scale,filter] duration-(--duration-slow) ease-panel data-[ending-style]:duration-(--duration-base) data-[ending-style]:ease-out",
  "data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[starting-style]:blur-[4px]",
  "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[2px]",
]);

export const dropdownMenuPositionerVariants = cva("isolate z-50 outline-none");
