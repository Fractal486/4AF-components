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
    "aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "selection:bg-primary selection:text-primary-foreground",
  ],
  {
    variants: {
      variant: {
        default:
          "border border-[oklch(0.297_0_0)] hover:border-[oklch(0.390_0_0)] focus:border-[oklch(0.719_0_0)] focus:shadow-[0_0_0_3px_oklch(0.390_0_0_/_0.502)]",
        plain:
          "border-0 shadow-none hover:border-0 focus:border-0 focus:shadow-none hover:bg-transparent",
        underline:
          "rounded-none border-0 border-b border-b-[oklch(0.297_0_0)] px-0 shadow-none hover:border-b-[oklch(0.390_0_0)] focus:border-b-[oklch(0.719_0_0)] focus:shadow-none",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type InputVariants = VariantProps<typeof inputVariants>;
