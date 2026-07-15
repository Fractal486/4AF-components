import { cva, type VariantProps } from "class-variance-authority";

export const checkboxVariants = cva(
  [
    "peer relative inline-flex shrink-0 cursor-pointer items-center justify-center",
    // Unchecked reads as a recessed well: a thin border around a fill darker than the
    // surface it sits on. `dark:` drops below the page background (nothing in the theme
    // scale is darker than `background`, so this reaches for the ramp); light mode keeps
    // the page colour, where a darker fill would read as filled-in.
    "border-[1.5px] border-border bg-background text-primary-foreground dark:bg-neutral-1000",
    // Colour fills as the box checks; the press scale is Motion's, on transform.
    "transition-[background-color,border-color,box-shadow] duration-(--duration-base) ease-out",
    // Base UI marks state with data attributes. Checked and indeterminate read the
    // same here — both fill the box; the indicator inside says which.
    "data-[checked]:border-primary data-[checked]:bg-primary",
    "data-[indeterminate]:border-primary data-[indeterminate]:bg-primary",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // Non-native button (a span) — the `:disabled` pseudo never matches it, so the
    // disabled affordance keys off Base UI's data attribute instead.
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/40",
    // Held permanently on its own layer: without it, scaling on press re-rasterizes
    // the box and its border snaps against the pixel grid — the same jump the buttons
    // had, and worse on something this small.
    "will-change-transform",
  ],
  {
    variants: {
      size: {
        sm: "size-4 rounded-[4px]",
        md: "size-5 rounded-[5px]",
        lg: "size-6 rounded-md",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type CheckboxVariants = VariantProps<typeof checkboxVariants>;
