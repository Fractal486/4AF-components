"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronsUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A select that opens **on** its trigger rather than below it.
 *
 * The panel takes the trigger's width and is positioned so the selected row lands exactly
 * where the trigger's value was — press it and the current choice doesn't move, the other
 * options simply appear around it. It's the macOS pop-up button, and the reason to reach
 * for it over the plain Select is that it keeps the eye where it already is: nothing
 * travels, so there's nothing to re-find.
 *
 * The positioning is Base UI's `alignItemWithTrigger`, not arithmetic here — which matters
 * for the two cases it handles that hand-rolled maths gets wrong. It applies to **pointer
 * input only**, and it switches itself off when there isn't room to overlap. Both are
 * deliberate: opened from the keyboard there is no pointer to keep still, and a panel
 * clamped against the viewport edge can't honour the alignment anyway. In either case it
 * falls back to an ordinary dropdown rather than fighting for it.
 *
 * The trigger's glyph is `ChevronsUpDown`, and that's the honest signal: a single
 * chevron-down promises the panel appears *below*, which here it doesn't. Two chevrons say
 * the list extends in both directions from where you are.
 *
 * The entrance scales from `--transform-origin`, which Base UI points at the anchor's centre
 * while the panel overlaps it — so the list opens *around* the selected row rather than over
 * it, and the row itself never moves.
 *
 * **The horizontal geometry is load-bearing.** The panel's `p-1` plus a row's `px-2.5`
 * comes to the trigger's `px-3.5`, which is what puts the selected label on top of the
 * trigger's value rather than a few pixels off it. Change one and change the others. The
 * check sits at the *end* of a row for the same reason: a leading check would push every
 * label right and break the alignment the component exists for.
 */

type AlignedSelectSize = "sm" | "md";

const SIZE: Record<AlignedSelectSize, { field: string; row: string; glyph: string }> = {
  sm: { field: "h-8 text-xs", row: "text-xs", glyph: "size-3.5" },
  md: { field: "h-9 text-sm", row: "text-sm", glyph: "size-4" },
};

const AlignedSelectContext = createContext<AlignedSelectSize>("sm");

// The library's thin scrollbar, shared with the menu, dialog and the other select panels.
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

export interface AlignedSelectProps<Value>
  extends ComponentProps<typeof BaseSelect.Root<Value, false>> {
  /** Control height. `md` lines up with Button and Input in a form row. @default sm */
  size?: AlignedSelectSize;
}

export function AlignedSelect<Value>({ size = "sm", ...props }: AlignedSelectProps<Value>) {
  return (
    <AlignedSelectContext.Provider value={size}>
      <BaseSelect.Root {...props} />
    </AlignedSelectContext.Provider>
  );
}

export interface AlignedSelectTriggerProps
  extends Omit<ComponentProps<typeof BaseSelect.Trigger>, "children"> {
  /** Shown until something is selected. */
  placeholder?: ReactNode;
}

export function AlignedSelectTrigger({
  className,
  placeholder,
  ...props
}: AlignedSelectTriggerProps) {
  const size = useContext(AlignedSelectContext);

  return (
    <BaseSelect.Trigger
      data-slot="aligned-select-trigger"
      className={cn(
        "group flex w-full cursor-pointer items-center justify-between gap-2",
        "rounded-md border border-border bg-surface px-3.5 text-foreground",
        SIZE[size].field,
        "outline-none select-none",
        "transition-[background-color,border-color] duration-(--duration-base) ease-out",
        "hover:border-border-strong data-[popup-open]:border-border-strong",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <BaseSelect.Value className="truncate" placeholder={placeholder} />
      {/* Not a rotating chevron: there is no direction to point at, because the panel opens
          where the trigger already is. A static pair reads as "there is more above and
          below this", which is exactly what happens. */}
      <BaseSelect.Icon className="shrink-0 text-muted-foreground">
        <ChevronsUpDown className={SIZE[size].glyph} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export interface AlignedSelectContentProps
  extends ComponentProps<typeof BaseSelect.Popup> {
  /** Forwarded to Base UI's positioner (collision padding, sticky, and the rest). */
  positionerProps?: Omit<
    ComponentProps<typeof BaseSelect.Positioner>,
    "className" | "children" | "alignItemWithTrigger"
  >;
}

export function AlignedSelectContent({
  className,
  positionerProps,
  children,
  ...props
}: AlignedSelectContentProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        // The whole variant, in one prop. Base UI overlaps the trigger and offsets the
        // panel by the selected item's position inside it.
        alignItemWithTrigger
        className="z-50 w-[var(--anchor-width)] outline-none"
        {...positionerProps}
      >
        <BaseSelect.Popup
          data-slot="aligned-select-content"
          className={cn(
            "overflow-hidden rounded-md border border-border bg-surface shadow-overlay-drop",
            // Grown out of the selected row, which is the one thing that must not move.
            //
            // Base UI publishes an origin for exactly this case: when the panel overlaps its
            // anchor it sets `--transform-origin` to the anchor's centre expressed *inside*
            // the panel — here, the row sitting on the trigger. Scaling from that point makes
            // the list visibly open around the current choice rather than materialise over
            // it, which is the whole premise of the variant stated in motion instead of by
            // position alone. A centre-origin scale would be wrong, and that difference is
            // the entire reason this reads as anchored.
            //
            // `--duration-base` rather than `fast`: a scale needs a little longer to register
            // than a bare fade, and selects budget 150–250ms.
            "origin-[var(--transform-origin)] blur-0",
            "transition-[opacity,scale,filter] duration-(--duration-base) ease-out",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:blur-[3px]",
            "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[2px]",
            className,
          )}
          {...props}
        >
          {/* Base UI needs these once the list is taller than the space it has: overlapping
              the trigger means the panel can't simply grow downward, so it scrolls, and
              these are how a pointer user reaches the ends of it. */}
          <BaseSelect.ScrollUpArrow className="flex h-5 items-center justify-center bg-surface text-muted-foreground">
            <ChevronUp className="size-3.5" />
          </BaseSelect.ScrollUpArrow>

          <div className={cn("max-h-[min(var(--available-height),18rem)] overflow-y-auto p-1", SCROLLBAR)}>
            {children}
          </div>

          <BaseSelect.ScrollDownArrow className="flex h-5 items-center justify-center bg-surface text-muted-foreground">
            <ChevronDown className="size-3.5" />
          </BaseSelect.ScrollDownArrow>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export function AlignedSelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseSelect.Item>) {
  const size = useContext(AlignedSelectContext);

  return (
    <BaseSelect.Item
      data-slot="aligned-select-item"
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xs px-2.5 py-1.5 outline-none select-none",
        SIZE[size].row,
        "text-muted-foreground",
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[selected]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      {/* A reserved slot, occupied or not, so a row's label sits at the same x whether or
          not it is the selected one. */}
      <span className="flex size-3.5 shrink-0 items-center justify-center">
        <BaseSelect.ItemIndicator className="text-foreground">
          <Check className="size-3.5" />
        </BaseSelect.ItemIndicator>
      </span>
    </BaseSelect.Item>
  );
}
