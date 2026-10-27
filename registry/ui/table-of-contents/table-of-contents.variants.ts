import { cva, type VariantProps } from "class-variance-authority";
import { TABLE_OF_CONTENTS_EDGE_FADE } from "@/registry/lib/table-of-contents-scroll";

export const tableOfContentsVariants = cva(
  [
    "min-h-0 overflow-y-auto overscroll-y-contain overflow-x-clip pe-1 text-sm [overflow-anchor:none] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
    TABLE_OF_CONTENTS_EDGE_FADE,
  ],
  {
    variants: {
      variant: {
        /** Highlight every heading currently visible and span the marker across their range. */
        span: "",
        /** Highlight one heading and keep the marker beside that entry only. */
        single: "",
      },
      /**
       * `hover` leaves only the rail and its marker showing until the list is pointed at
       * or focused. The group is named because the reveal belongs to the *list*: a
       * row-scoped hover would flicker one heading in and out as the pointer travelled
       * down, and you would never see the set.
       */
      labels: {
        always: "",
        hover: "group/toc",
      },
    },
    defaultVariants: { variant: "span", labels: "always" },
  },
);

export type TableOfContentsVariants = VariantProps<typeof tableOfContentsVariants>;
