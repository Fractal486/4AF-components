import { cva, type VariantProps } from "class-variance-authority";

export type SelectTriggerVariant = "default" | "ghost" | "plain";
export type SelectTriggerTone = "neutral" | "accent";

/** The standard field trigger: a boxed field, a ghost field, or a borderless text control. */
export const selectTriggerVariants = cva(
  [
    "group flex items-center gap-2 text-foreground",
    "cursor-pointer outline-none select-none",
    "transition-[background-color,border-color,color] duration-(--duration-base) ease-out",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: [
          "w-full justify-between border border-border bg-surface px-3.5",
          "hover:border-border-strong",
          "[&:is([aria-invalid=true],[data-invalid])]:border-destructive! [&:is([aria-invalid=true],[data-invalid])]:ring-[3px]! [&:is([aria-invalid=true],[data-invalid])]:ring-destructive/25!",
        ],
        ghost: [
          "w-full justify-between border border-transparent bg-transparent px-3.5 text-muted-foreground",
          "hover:border-transparent hover:bg-muted hover:text-foreground",
          "data-[popup-open]:border-transparent data-[popup-open]:bg-muted data-[popup-open]:text-foreground",
          "[&:is([aria-invalid=true],[data-invalid])]:ring-[3px]! [&:is([aria-invalid=true],[data-invalid])]:ring-destructive/25!",
        ],
        // Plain keeps the control's hit area and type scale, but owns no surface or edge.
        // The explicit transparent hover/open states keep a consumer's global button styles
        // from reintroducing a fill when the panel changes state.
        plain: [
          "w-auto justify-start gap-1.5 border-0 bg-transparent px-0",
          "hover:border-0 hover:bg-transparent data-[popup-open]:border-0 data-[popup-open]:bg-transparent",
          "[&:is([aria-invalid=true],[data-invalid])]:ring-[3px]! [&:is([aria-invalid=true],[data-invalid])]:ring-destructive/25!",
        ],
      },
      // The open field wears the inner edge of Input's focus ring — its border colour, without
      // the outer halo. Boxed `default` variant only.
      tone: { neutral: "", accent: "" },
    },
    compoundVariants: [
      {
        variant: "default",
        tone: "neutral",
        class: "data-[popup-open]:border-[oklch(0.719_0_0)]",
      },
      {
        variant: "default",
        tone: "accent",
        class: "data-[popup-open]:border-ring",
      },
    ],
    defaultVariants: { variant: "default", tone: "neutral" },
  },
);

/** The compact sort/filter trigger: a chip, a ghost chip, or a borderless text control. */
export const selectSortTriggerVariants = cva(
  [
    "group inline-flex max-w-full cursor-pointer items-center gap-2 text-foreground outline-none select-none",
    "transition-[background-color,border-color,color] duration-(--duration-base) ease-out",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
    "[&:is([aria-invalid=true],[data-invalid])]:ring-[3px]! [&:is([aria-invalid=true],[data-invalid])]:ring-destructive/25!",
  ],
  {
    variants: {
      variant: {
        default: [
          "border hover:border-border-strong",
          "[&:is([aria-invalid=true],[data-invalid])]:border-destructive!",
          "data-[popup-open]:border-border-strong data-[popup-open]:bg-muted",
        ],
        ghost: [
          "border border-transparent bg-transparent text-muted-foreground",
          "hover:border-transparent hover:bg-muted hover:text-foreground",
          "data-[popup-open]:border-transparent data-[popup-open]:bg-muted data-[popup-open]:text-foreground",
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
