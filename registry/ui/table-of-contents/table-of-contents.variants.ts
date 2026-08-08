import { cva, type VariantProps } from "class-variance-authority";

export const tableOfContentsVariants = cva("text-sm", {
  variants: {
    variant: {
      /** Highlight every heading currently visible and span the marker across their range. */
      span: "",
      /** Highlight one heading and keep the marker beside that entry only. */
      single: "",
    },
  },
  defaultVariants: { variant: "span" },
});

export type TableOfContentsVariants = VariantProps<typeof tableOfContentsVariants>;
