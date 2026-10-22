import { cva } from "class-variance-authority";

/**
 * Pressed state leaves the background available for hover feedback and preserves solid
 * variant fills. State is shown through icon fill, labels, and `aria-pressed`; quiet
 * variants also strengthen the text color.
 */
export const pressedVariants = cva("", {
  variants: {
    variant: {
      ghost: "data-[pressed]:text-foreground",
      plain: "data-[pressed]:text-foreground",
      outline: "",
      primary: "",
      destructive: "",
      link: "",
    },
  },
  defaultVariants: { variant: "ghost" },
});
