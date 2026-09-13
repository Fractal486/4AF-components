import { cva, type VariantProps } from "class-variance-authority";

/**
 * The matrix is a fixed 4×4 grid. Size changes the dot and the gap together so
 * the pattern keeps its rhythm instead of growing only in one direction.
 */
export const matrixLoaderVariants = cva(
  [
    "grid grid-cols-4 grid-rows-4 gap-[var(--matrix-gap)] select-none",
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
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

export type MatrixLoaderVariants = VariantProps<typeof matrixLoaderVariants>;
