import { cva, type VariantProps } from "class-variance-authority";

/**
 * The matrix is a 4×4 or 5×5 grid. Size changes the dot and the gap together so
 * the pattern keeps its rhythm instead of growing only in one direction.
 */
export const matrixLoaderVariants = cva(
  [
    "grid gap-[var(--matrix-gap)] select-none",
    "[&>i]:block [&>i]:size-[var(--matrix-dot-size)]",
    "[&>i]:bg-[var(--matrix-active)] [&>i]:animate-matrix-pulse",
  ],
  {
    variants: {
      size: {
        sm: "[--matrix-dot-size:2px] [--matrix-gap:2px]",
        md: "[--matrix-dot-size:3px] [--matrix-gap:2px]",
        lg: "[--matrix-dot-size:4px] [--matrix-gap:3px]",
      },
      grid: {
        "4": "grid-cols-4 grid-rows-4",
        "5": "grid-cols-5 grid-rows-5",
      },
      shape: {
        square: "",
        dot: "[&>i]:rounded-full",
      },
    },
    defaultVariants: {
      size: "sm",
      grid: "4",
      shape: "square",
    },
  },
);

export type MatrixLoaderVariants = VariantProps<typeof matrixLoaderVariants>;
