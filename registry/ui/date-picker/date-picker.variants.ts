import { cva, type VariantProps } from "class-variance-authority";

/**
 * The picker's trigger is a form field, so it wears the Select trigger's geometry and
 * edges: a date picker beside a select or an input in a form row lines up with both.
 * `md` (34px) is the default here, matching Input, because a date is almost always
 * entered in a form rather than a toolbar.
 *
 * The boxed variants are exactly as wide as the panel: seven calendar cells, the grid's 6px
 * side padding twice, and the panel's 1px border twice. Built from the Calendar's own numbers
 * (34px cells on every device), so the two stay flush.
 */
const PANEL_WIDTH =
  "w-[calc(var(--spacing)*8.5*7+var(--spacing)*1.5*2+2px)]";

export const datePickerTriggerVariants = cva(
  [
    "group inline-flex max-w-full min-w-0 items-center gap-2 text-start text-foreground tabular-nums",
    "cursor-pointer outline-none select-none",
    "transition-[background-color,border-color,color] duration-(--duration-base) ease-out",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
  ],
  {
    variants: {
      variant: {
        default: [
          PANEL_WIDTH,
          "border border-border bg-surface",
          "hover:border-border-strong",
          "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
        ],
        // Button's outline-ghost: the `shadow-border` edge with no fill of its own, so the
        // background shows through; hover and open lay a translucent wash. The border stays,
        // transparent, so the invalid state can colour an edge without changing the size.
        "outline-ghost": [
          PANEL_WIDTH,
          "border border-transparent bg-transparent shadow-border",
          "hover:bg-foreground/5 data-[popup-open]:bg-foreground/5",
          "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
        ],
        ghost: [
          PANEL_WIDTH,
          "border border-transparent bg-transparent text-muted-foreground",
          "hover:bg-muted hover:text-foreground",
          "data-[popup-open]:bg-muted data-[popup-open]:text-foreground",
          "aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
        ],
        // Keeps the hit area and type scale, owns no surface or edge.
        plain: [
          "w-auto gap-1.5 border-0 bg-transparent px-0",
          "aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
        ],
      },
      size: {
        xs: "h-6 rounded-[6px] px-2 text-xs [&_svg]:size-3.5",
        sm: "h-[30px] rounded-[6px] px-3 text-xs [&_svg]:size-3.5",
        md: "h-[34px] rounded-[8px] px-3 text-sm [&_svg]:size-4",
      },
      // The open field's border, as Select's trigger: the inner edge of Input's focus ring,
      // without the outer halo. Boxed `default` variant only.
      tone: { neutral: "", accent: "" },
    },
    compoundVariants: [
      { variant: "plain", class: "px-0" },
      { variant: "default", tone: "neutral", class: "data-[popup-open]:border-[oklch(0.719_0_0)]" },
      { variant: "default", tone: "accent", class: "data-[popup-open]:border-ring" },
    ],
    defaultVariants: { variant: "default", size: "md", tone: "neutral" },
  },
);

export type DatePickerTriggerVariants = VariantProps<typeof datePickerTriggerVariants>;
