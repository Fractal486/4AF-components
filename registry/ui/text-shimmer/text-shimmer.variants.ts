import { cva } from "class-variance-authority";

// The label truncates itself: a parent's ellipsis cannot reach into an inline-block.
// Keep these utilities separate so caller overflow classes do not remove white-space.
export const textShimmerVariants = cva(
  "shimmer-text animate-text-shimmer inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-top",
);
