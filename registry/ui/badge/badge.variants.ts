import { cva, type VariantProps } from "class-variance-authority";

/**
 * `status` sets the ink — the glyph and text colour — and it's the same across variants.
 * `solid` adds a translucent wash of that status colour while keeping the text and glyph
 * stronger; `outline` has a neutral gray outline and no fill; `plain` drops the box entirely.
 * `shape` keeps boxed badges softly rounded by default or fully rounds them into a pill.
 * `warning` spends the amber accent (that's what amber is *for*, a caution signal) and
 * `success` the green token; tints are translucent so a solid badge sits on any surface.
 */
export const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center overflow-hidden font-medium whitespace-nowrap tabular-nums",
  {
    variants: {
      variant: {
        plain: "",
        solid: "",
        outline: "border border-border-strong",
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
        sm: "gap-1 text-2xs",
        md: "gap-1.5 text-xs",
        lg: "gap-2 text-sm",
      },
      shape: {
        rounded: "",
        pill: "",
      },
    },
    compoundVariants: [
      // Height, radius, and padding shape the boxed variants; `plain` stays box-less.
      { variant: ["solid", "outline"], size: "sm", shape: "rounded", class: "h-4 rounded-[4px] px-1" },
      { variant: ["solid", "outline"], size: "md", shape: "rounded", class: "h-5 rounded-[4px] px-1.5" },
      { variant: ["solid", "outline"], size: "lg", shape: "rounded", class: "h-6 rounded-[6px] px-2" },
      { variant: ["solid", "outline"], size: "sm", shape: "pill", class: "h-4 rounded-full px-1" },
      { variant: ["solid", "outline"], size: "md", shape: "pill", class: "h-5 rounded-full px-1.5" },
      { variant: ["solid", "outline"], size: "lg", shape: "pill", class: "h-6 rounded-full px-2" },
      // `solid`: a translucent status wash with stronger status-coloured ink.
      { variant: "solid", status: "neutral", class: "bg-muted-foreground/10" },
      { variant: "solid", status: "info", class: "bg-primary/[0.06]" },
      { variant: "solid", status: "success", class: "bg-success/10" },
      { variant: "solid", status: "warning", class: "bg-accent-500/10" },
      { variant: "solid", status: "danger", class: "bg-destructive/10" },
      { variant: "solid", status: "loading", class: "bg-muted-foreground/10" },
    ],
    defaultVariants: { variant: "solid", status: "neutral", size: "sm", shape: "rounded" },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
