import { cva, type VariantProps } from "class-variance-authority";
import { TABLE_OF_CONTENTS_EDGE_FADE } from "@/registry/lib/table-of-contents-scroll";

export const tableOfContentsLinesVariants = cva(
  [
    "min-h-0 overflow-y-auto overscroll-y-contain overflow-x-clip pe-1 text-sm [overflow-anchor:none] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
    TABLE_OF_CONTENTS_EDGE_FADE,
  ],
  {
    variants: {
      /**
       * `hover` leaves only the rules showing until the list is pointed at or focused,
       * which is the whole reason this variant draws rules at all.
       *
       * The group is named because the reveal belongs to the *list*: a row-scoped hover
       * would flicker one label in and out as the pointer travelled down, and you would
       * never see the set.
       */
      labels: {
        always: "",
        hover: "group/toc",
      },
    },
    defaultVariants: { labels: "always" },
  },
);

export type TableOfContentsLinesVariants = VariantProps<typeof tableOfContentsLinesVariants>;
