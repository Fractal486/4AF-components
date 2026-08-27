import { cva, type VariantProps } from "class-variance-authority";

export const tableOfContentsLinesVariants = cva(
  "min-h-0 overflow-y-auto overscroll-y-contain overflow-x-clip pe-1 text-sm [overflow-anchor:none] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
);

export type TableOfContentsLinesVariants = VariantProps<typeof tableOfContentsLinesVariants>;
