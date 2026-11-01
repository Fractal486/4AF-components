import { cva, type VariantProps } from "class-variance-authority";

export const progressColorVariants = cva("text-primary forced-colors:text-[Highlight]");

export const progressTrackVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-muted forced-colors:outline forced-colors:outline-1",
  {
    variants: { size: { xs: "h-0.5", sm: "h-1", md: "h-2", lg: "h-3" } },
    defaultVariants: { size: "md" },
  },
);

export const progressIndicatorVariants = cva([
  "h-full rounded-full bg-current transition-transform duration-(--duration-slow) ease-out",
  // Loops use their own duration: reducing a repeating animation to 1ms would strobe.
  "data-[indeterminate]:absolute data-[indeterminate]:inset-y-0 data-[indeterminate]:start-0 data-[indeterminate]:w-2/5",
  "data-[indeterminate]:animate-[progress-slide_1.6s_linear_infinite] motion-reduce:data-[indeterminate]:animate-none",
]);

export const progressSegmentVariants = cva(
  "absolute inset-0 bg-current transition-[clip-path] duration-(--duration-slow) ease-out",
);

export const progressCircleVariants = cva(
  "relative inline-grid shrink-0 place-items-center [&>*]:col-start-1 [&>*]:row-start-1",
  {
    variants: {
      size: {
        sm: "size-4 text-[8px] [--progress-stroke:3]",
        md: "size-6 text-[8px] [--progress-stroke:2.5]",
        lg: "size-10 text-[10px] [--progress-stroke:2]",
        xl: "size-16 text-sm [--progress-stroke:1.5]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const progressCircleSvgVariants = cva(
  "size-full overflow-visible data-[indeterminate]:animate-spin motion-reduce:data-[indeterminate]:animate-none",
);

export const progressCircleTrackVariants = cva(
  "stroke-muted [stroke-width:var(--progress-stroke)] forced-colors:stroke-[CanvasText]",
);

export const progressCircleIndicatorVariants = cva([
  "stroke-current [stroke-width:var(--progress-stroke)] [stroke-linecap:round]",
  "transition-[stroke-dashoffset,opacity] duration-(--duration-slow) ease-out data-[empty]:opacity-0",
]);

export type ProgressSize = NonNullable<VariantProps<typeof progressTrackVariants>["size"]>;
export type ProgressCircleSize = NonNullable<VariantProps<typeof progressCircleVariants>["size"]>;
