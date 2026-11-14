import { cva, type VariantProps } from "class-variance-authority";

// The root resets the inherited animation name, including for nested empty states.
// Backwards fill hides each part during its delay without retaining a transform afterwards.
const entrance = "animate-[var(--duration-base)_var(--ease-out)_backwards_var(--empty-animation,none)] motion-reduce:animate-none";

export const emptyVariants = cva(
  "flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border-dashed border-border text-center text-balance [--empty-animation:none] data-[animated]:[--empty-animation:empty-enter]",
  {
    variants: {
      size: {
        md: "gap-6 p-6 md:p-12 [--empty-header-gap:--spacing(2)] [--empty-media-gap:--spacing(2)] [--empty-media-size:--spacing(10)] [--empty-icon-size:--spacing(6)] [--empty-title-size:var(--text-lg)] [--empty-title-leading:var(--text-lg--line-height)]",
        sm: "gap-4 p-6 [--empty-header-gap:--spacing(1)] [--empty-media-gap:--spacing(1)] [--empty-media-size:--spacing(9)] [--empty-icon-size:--spacing(5)] [--empty-title-size:var(--text-base)] [--empty-title-leading:var(--text-base--line-height)]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const emptyHeaderVariants = cva(
  "flex w-full min-w-0 max-w-sm flex-col items-center gap-[var(--empty-header-gap,--spacing(2))] text-center",
);

export const emptyMediaVariants = cva(
  [entrance, "mb-[var(--empty-media-gap,--spacing(2))] flex max-w-full shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0"],
  {
    variants: {
      variant: {
        default: "bg-transparent text-muted-foreground",
        icon: "size-[var(--empty-media-size,--spacing(10))] rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-[var(--empty-icon-size,--spacing(6))]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export const emptyTitleVariants = cva([
  entrance,
  "max-w-full min-w-0 text-[length:var(--empty-title-size,var(--text-lg))] leading-[var(--empty-title-leading,var(--text-lg--line-height))] font-medium tracking-tight wrap-anywhere text-foreground [animation-delay:calc(var(--duration-base)*0.2)]",
]);

export const emptyDescriptionVariants = cva([
  entrance,
  "max-w-full min-w-0 text-sm/relaxed wrap-anywhere text-muted-foreground [animation-delay:calc(var(--duration-base)*0.4)]",
  "[&>p:not(:last-child)]:mb-2 [&_a:not([data-slot]):not([data-variant])]:underline [&_a:not([data-slot]):not([data-variant])]:underline-offset-4 [&_a:not([data-slot]):not([data-variant])]:transition-[color] [&_a:not([data-slot]):not([data-variant])]:duration-(--duration-fast) [&_a:not([data-slot]):not([data-variant]):hover]:text-foreground",
  "[&_a:not([data-slot]):not([data-variant]):focus-visible]:rounded-xs [&_a:not([data-slot]):not([data-variant]):focus-visible]:outline-2 [&_a:not([data-slot]):not([data-variant]):focus-visible]:outline-offset-2 [&_a:not([data-slot]):not([data-variant]):focus-visible]:outline-ring",
]);

export const emptyContentVariants = cva([
  entrance,
  "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance [animation-delay:calc(var(--duration-base)*0.6)]",
]);

export type EmptyMediaVariants = VariantProps<typeof emptyMediaVariants>;
