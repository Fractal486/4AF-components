import { cva, type VariantProps } from "class-variance-authority";

export type SelectTriggerVariant = "default" | "plain";

/** The standard field trigger: a boxed field or a borderless text control. */
export const selectTriggerVariants = cva(
  [
    "group flex items-center gap-2 text-foreground",
    "cursor-pointer outline-none select-none",
    "transition-[background-color,border-color] duration-(--duration-base) ease-out",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: [
          "w-full justify-between border border-border bg-surface px-3.5",
          "hover:border-border-strong data-[popup-open]:border-border-strong",
          "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
        ],
        // Plain keeps the control's hit area and type scale, but owns no surface or edge.
        // The explicit transparent hover/open states keep a consumer's global button styles
        // from reintroducing a fill when the panel changes state.
        plain: [
          "w-auto justify-start gap-1.5 border-0 bg-transparent px-0",
          "hover:border-0 hover:bg-transparent data-[popup-open]:border-0 data-[popup-open]:bg-transparent",
          "aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
        ],
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/** The compact sort/filter trigger: a chip or a borderless text control. */
export const selectSortTriggerVariants = cva(
  [
    "group inline-flex max-w-full cursor-pointer items-center gap-2 text-foreground outline-none select-none",
    "transition-[background-color,border-color] duration-(--duration-base) ease-out",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: [
          "border hover:border-border-strong",
          "data-[popup-open]:border-border-strong data-[popup-open]:bg-muted",
        ],
        plain: [
          "gap-1.5 border-0 bg-transparent px-0",
          "hover:border-0 hover:bg-transparent data-[popup-open]:border-0 data-[popup-open]:bg-transparent",
        ],
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type SelectTriggerVariants = VariantProps<typeof selectTriggerVariants>;
export type SelectSortTriggerVariants = VariantProps<typeof selectSortTriggerVariants>;
