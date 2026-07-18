import { cva, type VariantProps } from "class-variance-authority";

/**
 * The state circle: a soft, translucent chip whose tint is the status signal — a faint
 * green wash for success, red for a failure, and a barely-there ink wash for everything
 * else (info, loading, plain). The glyph carries the actual colour; the fill is a 6–10%
 * tint so it reads as a hint, not a badge. Translucent (not the solid `bg-*` tokens) so it
 * sits correctly on whatever surface the toast lands on.
 */
export const toastIconVariants = cva(
  // `self-center`: the row is `items-start` (title and close hug the top), but the state
  // circle centres vertically against the whole content block, one line or two.
  "inline-flex size-7 shrink-0 items-center justify-center self-center rounded-full [&>svg]:size-3.5",
  {
    variants: {
      type: {
        neutral: "bg-primary/[0.06] text-muted-foreground",
        info: "bg-primary/[0.06] text-muted-foreground",
        loading: "bg-primary/[0.06] text-muted-foreground",
        success: "bg-success/10 text-success",
        error: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { type: "neutral" },
  },
);

export type ToastType = NonNullable<VariantProps<typeof toastIconVariants>["type"]>;
