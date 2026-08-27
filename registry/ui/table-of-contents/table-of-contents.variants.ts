import { cva, type VariantProps } from "class-variance-authority";

export const tableOfContentsVariants = cva(
  "min-h-0 overflow-y-auto overscroll-y-contain overflow-x-clip pe-1 text-sm [overflow-anchor:none] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
  {
    variants: {
      variant: {
        /** Highlight every heading currently visible and span the marker across their range. */
        span: "",
        /** Highlight one heading and keep the marker beside that entry only. */
        single: "",
      },
    },
    defaultVariants: { variant: "span" },
  },
);

export type TableOfContentsVariants = VariantProps<typeof tableOfContentsVariants>;
