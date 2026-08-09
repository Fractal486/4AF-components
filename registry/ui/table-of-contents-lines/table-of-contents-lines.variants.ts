import { cva, type VariantProps } from "class-variance-authority";

export const tableOfContentsLinesVariants = cva("text-sm");

export type TableOfContentsLinesVariants = VariantProps<typeof tableOfContentsLinesVariants>;
