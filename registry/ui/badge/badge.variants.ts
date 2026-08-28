import { cva, type VariantProps } from "class-variance-authority";

/**
 * `status` sets the ink — the glyph and text colour — and it's the same across variants.
 * `solid` wraps it in a translucent pill (a ~10% wash of the same hue plus a hairline
 * border, fully rounded); `outline` is the same pill hollowed out — a border and no
 * fill. They share the radius on purpose: the two are the same object at two weights,
 * and a boxier outline reads as a different component rather than a quieter one.
 * `bare` drops the box entirely, leaving just the coloured glyph and text. `warning` spends the amber accent (that's what amber is *for*,
 * a caution signal) and `success` the green token; tints are translucent so a boxed badge
 * sits on any surface.
 */
export const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center overflow-hidden font-medium whitespace-nowrap tabular-nums",
  {
    variants: {
      variant: {
        solid: "rounded-full border",
        outline: "rounded-full border",
        bare: "",
      },
      status: {
        neutral: "text-muted-foreground",
        info: "text-foreground",
        success: "text-success",
        warning: "text-accent-700 dark:text-accent-400",
        danger: "text-destructive",
        loading: "text-muted-foreground",
      },
      size: {
        sm: "gap-1.5 text-2xs",
        md: "gap-2 text-xs",
      },
    },
    compoundVariants: [
      // Height and padding shape the boxed variants; `bare` stays box-less.
      { variant: ["solid", "outline"], size: "sm", class: "h-6 px-2" },
      { variant: ["solid", "outline"], size: "md", class: "h-8 px-3" },
      // `solid`: border + translucent wash.
      { variant: "solid", status: "neutral", class: "border-border bg-surface" },
      { variant: "solid", status: "info", class: "border-primary/20 bg-primary/[0.06]" },
      { variant: "solid", status: "success", class: "border-success/30 bg-success/10" },
      { variant: "solid", status: "warning", class: "border-accent-500/30 bg-accent-500/10" },
      { variant: "solid", status: "danger", class: "border-destructive/30 bg-destructive/10" },
      { variant: "solid", status: "loading", class: "border-primary/20 bg-primary/[0.06]" },
      // `outline`: border only, a touch stronger since there's no fill behind it.
      { variant: "outline", status: "neutral", class: "border-border-strong" },
      { variant: "outline", status: "info", class: "border-primary/25" },
      { variant: "outline", status: "success", class: "border-success/40" },
      { variant: "outline", status: "warning", class: "border-accent-500/40" },
      { variant: "outline", status: "danger", class: "border-destructive/40" },
      { variant: "outline", status: "loading", class: "border-primary/25" },
    ],
    defaultVariants: { variant: "solid", status: "neutral", size: "sm" },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
