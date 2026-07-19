import { cva, type VariantProps } from "class-variance-authority";

/**
 * Input keeps its versions in a sibling CVA file so the component stays focused on
 * Base UI's native input behaviour. `plain` is useful when the surrounding field
 * already provides the surface; the default is the standalone field treatment.
 */
export const inputVariants = cva(
  [
    "flex h-9 w-full min-w-0 rounded-md bg-transparent px-3 py-1 text-sm",
    "text-foreground placeholder:text-muted-foreground",
    "outline-none",
    "transition-[border-color,box-shadow,color,opacity] duration-(--duration-fast) ease-out",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Invalid mirrors the `accent` focus treatment in destructive red, persisting whether
    // or not the field is focused. The red border is shared by every variant (on
    // `underline` it colours the single bottom border); the 3px ring is added only to the
    // boxed `default` variant below.
    "aria-invalid:border-destructive",
    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "selection:bg-primary selection:text-primary-foreground",
  ],
  {
    variants: {
      // Structure: how the field is bordered. Focus *colour* is a separate axis
      // (`tone`) so either border shape can wear either focus colour.
      variant: {
        // Border tokens (not fixed greys), so rest/hover/focus match the Select trigger
        // exactly and follow the theme: `border` at rest, `border-strong` on hover.
        default: "border border-border hover:border-border-strong",
        plain: "border-0 shadow-none hover:border-0 focus:border-0 focus:shadow-none hover:bg-transparent",
        underline:
          "rounded-none border-0 border-b border-b-border px-0 shadow-none hover:border-b-border-strong",
      },
      // The focus colour. `neutral` is a grey ring that stands apart from the accent;
      // `accent` uses the `--ring` token, so it matches every other focusable control
      // in the app and follows the theme.
      tone: {
        neutral: "",
        accent: "",
      },
    },
    compoundVariants: [
      {
        // The invalid ring, boxed variant only — matches `accent`'s 3px ring but red.
        // `shadow-none` clears the neutral tone's grey focus shadow so only the red reads.
        variant: "default",
        class: "aria-invalid:ring-[3px] aria-invalid:ring-destructive/25 aria-invalid:shadow-none",
      },
      {
        // Rest/hover borders match the Select (tokens above). The *focus* border stays a
        // lighter grey than its ring so the thin border and the thick ring read as two tones
        // instead of merging — matching it to `border-strong` blends it into the ring.
        variant: "default",
        tone: "neutral",
        class: "focus:border-[oklch(0.719_0_0)] focus:shadow-[0_0_0_3px_oklch(0.390_0_0_/_0.502)]",
      },
      {
        variant: "default",
        tone: "accent",
        class: "focus:border-ring focus:ring-[3px] focus:ring-ring/25",
      },
      { variant: "underline", tone: "neutral", class: "focus:border-b-[oklch(0.719_0_0)]" },
      { variant: "underline", tone: "accent", class: "focus:border-b-ring" },
    ],
    defaultVariants: { variant: "default", tone: "neutral" },
  },
);

export type InputVariants = VariantProps<typeof inputVariants>;
