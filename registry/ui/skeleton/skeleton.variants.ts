import { cva } from "class-variance-authority";

export const skeletonVariants = cva([
  "relative data-[wrapped]:w-fit data-[wrapped]:max-w-full [&:where(span)]:inline-block [&:where(span)]:align-bottom",
  "data-[state=loading]:overflow-hidden data-[state=loading]:bg-muted data-[state=loading]:animate-pulse",
  "data-[revealed]:animate-[skeleton-reveal_var(--duration-base)_var(--ease-out)_both] motion-reduce:data-[state=loading]:animate-none motion-reduce:data-[revealed]:animate-none",
]);

export const skeletonContentVariants = cva("contents data-[loading]:invisible");
export const skeletonTextVariants = cva("flex w-full flex-col");
export const skeletonTextLineVariants = cva("flex h-[1lh] items-center");
