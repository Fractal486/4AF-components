import { cva, type VariantProps } from "class-variance-authority";

/**
 * The circle, sharing the Checkbox's recessed-well look so the two controls read as a
 * set — but a radio is a single choice, so it keeps its outline (rather than filling) and
 * shows a dot. The small size matches Checkbox's fixed 16px box; medium and large
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
    // The border stays neutral whether or not it's checked — only the dot inside changes,
    // so selection reads as the dot appearing, not the ring lighting up.
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/40",
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
