import { cva, type VariantProps } from "class-variance-authority";

export const tableOfContentsLinesVariants = cva("text-sm", {
  variants: {
    density: {
      comfortable: "",
      compact: "text-xs",
    },
  },
  defaultVariants: { density: "comfortable" },
});

export type TableOfContentsLinesVariants = VariantProps<typeof tableOfContentsLinesVariants>;
