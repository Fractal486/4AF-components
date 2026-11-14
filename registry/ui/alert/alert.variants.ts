import { cva, type VariantProps } from "class-variance-authority";

/**
 * Five weights of the same line: something is wrong, something is worth knowing before
 * you continue, something worked, something is simply worth saying, or something is still
 * happening.
 *
 * The inks are Badge's status colours, value for value. A line under a field and a badge
 * beside it are the same claim at two sizes, and if their greens or ambers differ at all
 * they read as two different severities rather than one. Amber steps to `warning-400` in
 * the dark theme because `warning-700` is tuned for white behind it and goes muddy on ink.
 *
 * Amber is reserved for warnings; the focus ring is the blue accent, so a caution never
 * reads as focus.
 *
 * The two neutrals are not interchangeable, and the difference is weight rather than hue.
 * `info` is full-strength ink — a note the user is meant to read. `loading` is muted,
 * because work in progress is not yet an outcome; giving it a colour, or even the weight
 * of a statement, would spend a signal on something that hasn't happened.
 */
// Visibility changes fade in place; layout stays unchanged throughout the transition.
export const alertVariants = cva([
  "mt-1.5 flex items-start gap-1.5 text-sm",
  "transition-opacity duration-(--duration-base) ease-out",
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
  // With only a description, the dismiss control owns the row above the message.
  "[&:has([data-slot=alert-description]):has([data-slot=alert-close]):not(:has([data-slot=alert-title]))_[data-slot=alert-glyph]]:mt-[1lh]",
], {
  variants: {
    variant: {
      error: "text-destructive",
      warning: "text-warning-700 dark:text-warning-400",
      success: "text-success",
      info: "text-foreground",
      loading: "text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "error",
  },
});

export type AlertVariants = VariantProps<typeof alertVariants>;

export const alertTitleVariants = cva("col-start-1 min-w-0 font-medium");
export const alertDescriptionVariants = cva("col-span-2 col-start-1 min-w-0 [&_a]:underline [&_a]:underline-offset-4");
export const alertCloseVariants = cva([
  "relative col-start-2 row-start-1 ms-3 flex h-[1lh] w-3.5 shrink-0 cursor-pointer items-center justify-center self-start justify-self-end after:absolute after:-inset-1.5",
  "text-muted-foreground hover:text-foreground",
  "outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  "transition-[color] duration-(--duration-fast)",
]);
