import { cva, type VariantProps } from "class-variance-authority";

/**
 * `status` sets the ink — the glyph and text colour — and it's the same across variants.
 * `solid` adds a translucent wash of that status colour while keeping the text and glyph
 * stronger; `outline` has a neutral gray outline and no fill; `plain` drops the box entirely.
 * `shape` keeps boxed badges softly rounded by default or fully rounds them into a pill.
 * `warning` spends the amber warning ramp (that's what amber is *for*, a caution signal) and
 * `success` the green token; tints are translucent so a solid badge sits on any surface.
 */
export const badgeVariants = cva(
  [
    "group/badge relative inline-flex max-w-full min-w-0 shrink-0 items-center overflow-hidden font-medium whitespace-nowrap tabular-nums",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:ring-2 aria-invalid:ring-destructive/40 aria-invalid:shadow-[inset_0_0_0_1px_var(--color-destructive)]",
    "transition-[background-color,color,box-shadow,scale,opacity] duration-(--duration-fast)",
    "[&:is(a,button,[role=button])]:cursor-pointer [&:is(a,button,[role=button])]:hover:after:opacity-[0.08] motion-safe:[&:is(a,button,[role=button])]:active:scale-[0.97]",
    "data-[neutral-text]:not-data-[variant=filled]:[&_[data-slot=badge-label]]:text-foreground",
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-current after:opacity-0 after:transition-opacity after:duration-(--duration-fast)",
    "has-[[data-slot=badge-close]]:overflow-visible data-[ending-style]:overflow-hidden data-[ending-style]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        plain: "",
        filled: "",
        solid: "",
        outline: "border border-border-strong",
      },
      status: {
        neutral: "text-muted-foreground",
        info: "text-foreground",
        success: "text-success",
        warning: "text-warning-700 dark:text-warning-400",
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
      { variant: ["solid", "outline", "filled"], size: "sm", shape: "rounded", class: "h-4 rounded-[4px] px-1" },
      { variant: ["solid", "outline", "filled"], size: "md", shape: "rounded", class: "h-5 rounded-[4px] px-1.5" },
      { variant: ["solid", "outline", "filled"], size: "lg", shape: "rounded", class: "h-6 rounded-[6px] px-2" },
      { variant: ["solid", "outline", "filled"], size: "sm", shape: "pill", class: "h-4 rounded-full px-1" },
      { variant: ["solid", "outline", "filled"], size: "md", shape: "pill", class: "h-5 rounded-full px-1.5" },
      { variant: ["solid", "outline", "filled"], size: "lg", shape: "pill", class: "h-6 rounded-full px-2" },
      { variant: "filled", status: ["neutral", "loading", "info"], class: "bg-primary text-primary-foreground" },
      { variant: "filled", status: "success", class: "bg-success text-success-foreground" },
      { variant: "filled", status: "warning", class: "bg-warning-500 text-neutral-950" },
      { variant: "filled", status: "danger", class: "bg-destructive text-destructive-foreground" },
      // `solid`: a translucent status wash with stronger status-coloured ink.
      { variant: "solid", status: "neutral", class: "bg-muted-foreground/10" },
      { variant: "solid", status: "info", class: "bg-primary/[0.06]" },
      { variant: "solid", status: "success", class: "bg-success/10" },
      { variant: "solid", status: "warning", class: "bg-warning-500/10" },
      { variant: "solid", status: "danger", class: "bg-destructive/10" },
      { variant: "solid", status: "loading", class: "bg-muted-foreground/10" },
    ],
    defaultVariants: { variant: "solid", status: "neutral", size: "sm", shape: "rounded" },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

export const badgeDotVariants = cva([
  "relative z-10 size-1.5 shrink-0 rounded-full bg-current group-data-[size=lg]/badge:size-2",
  "data-[pulse]:after:absolute data-[pulse]:after:inset-0 data-[pulse]:after:rounded-full data-[pulse]:after:bg-inherit motion-safe:data-[pulse]:after:animate-ping",
]);
export const badgeCloseVariants = cva([
  "relative z-10 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[2px] opacity-70 outline-none",
  "size-3 group-data-[size=md]/badge:size-3.5 group-data-[size=lg]/badge:size-4 [&_svg]:size-3/4",
  "hover:bg-current/15 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-40",
  "after:absolute after:-inset-1 transition-[opacity,background-color] duration-(--duration-fast)",
]);
