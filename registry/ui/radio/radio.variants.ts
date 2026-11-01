import { cva, type VariantProps } from "class-variance-authority";

/**
 * The circle, sharing the Checkbox's recessed-well look so the two controls read as a
 * set — but a radio is a single choice, so selection fills a white ring around an open
 * center. The small size matches Checkbox's fixed 16px box; medium and large
 * radios are 20px and 24px.
 */
export const radioVariants = cva(
  [
    "peer relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full",
    // The same recessed well as the Checkbox: a thin border around a fill darker than the
    // surface. `dark:` drops below the page background (reaching the ramp); light keeps the
    // page colour.
    "border-[1.5px] border-border bg-background dark:bg-neutral-1000",
    "transition-[box-shadow] duration-(--duration-base) ease-out",
    // The outer border stays neutral; the selection ring fills the interior.
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
    "[&:is([aria-invalid=true],[data-invalid])]:border-destructive [&:is([aria-invalid=true],[data-invalid])]:ring-2 [&:is([aria-invalid=true],[data-invalid])]:ring-destructive/40",
    // Held on its own layer so the press-scale doesn't snap the border to the pixel grid.
    "will-change-transform",
  ],
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-5",
        lg: "size-6",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type RadioVariants = VariantProps<typeof radioVariants>;

export const radioIndicatorVariants = cva(
  [
    "pointer-events-none absolute inset-0 rounded-full border-white",
    "scale-0 opacity-0 transition-[scale,opacity] duration-(--duration-fast) ease-out",
    "data-[checked]:scale-100 data-[checked]:opacity-100",
  ],
  {
    variants: {
      // Leave the former dot's 6/8/10px diameter open inside the 1.5px outer border.
      size: {
        sm: "border-[3.5px]",
        md: "border-[4.5px]",
        lg: "border-[5.5px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);
