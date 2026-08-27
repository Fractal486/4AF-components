import { cva, type VariantProps } from "class-variance-authority";

export type AlignedSelectTriggerVariant = "default" | "plain";

/** The aligned trigger: a field or a borderless text control. */
export const alignedSelectTriggerVariants = cva(
  [
    "group flex items-center gap-2 text-foreground",
    "cursor-pointer outline-none select-none",
    "transition-[background-color,border-color] duration-(--duration-base) ease-out",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: [
          "w-full justify-between rounded-md border border-border bg-surface px-3.5",
          "hover:border-border-strong data-[popup-open]:border-border-strong",
          "aria-invalid:border-destructive",
        ],
        // Plain keeps the compact control size while removing the field's surface, edge and
        // padding, so the static two-way glyph sits directly after the value.
        plain: [
          "w-auto justify-start gap-1.5 rounded-md border-0 bg-transparent px-0",
          "hover:border-0 hover:bg-transparent data-[popup-open]:border-0 data-[popup-open]:bg-transparent",
        ],
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type AlignedSelectTriggerVariants = VariantProps<typeof alignedSelectTriggerVariants>;
