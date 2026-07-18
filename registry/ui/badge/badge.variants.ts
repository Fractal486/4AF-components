import { cva, type VariantProps } from "class-variance-authority";

/**
 * `status` sets the ink — the glyph and text colour — and it's the same in both variants.
 * `solid` wraps that in a translucent pill (a ~10% wash of the same hue plus a hairline
 * border); `bare` drops the box entirely and leaves just the coloured glyph and text.
 * `warning` spends the amber accent (that's what amber is *for*, a caution signal) and
 * `success` the green token. Tints are translucent so a `solid` badge sits on any surface.
 */
export const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center overflow-hidden font-medium whitespace-nowrap tabular-nums",
  {
    variants: {
      variant: {
        solid: "rounded-full border",
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
      // The box (border + wash) is `solid`-only; `bare` keeps just the ink above.
      { variant: "solid", status: "neutral", class: "border-border bg-surface" },
      { variant: "solid", status: "info", class: "border-primary/20 bg-primary/[0.06]" },
      { variant: "solid", status: "success", class: "border-success/30 bg-success/10" },
      { variant: "solid", status: "warning", class: "border-accent-500/30 bg-accent-500/10" },
      { variant: "solid", status: "danger", class: "border-destructive/30 bg-destructive/10" },
      { variant: "solid", status: "loading", class: "border-primary/20 bg-primary/[0.06]" },
      // Height and padding shape the pill, so they're `solid`-only too.
      { variant: "solid", size: "sm", class: "h-6 px-2" },
      { variant: "solid", size: "md", class: "h-8 px-3" },
    ],
    defaultVariants: { variant: "solid", status: "neutral", size: "md" },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
