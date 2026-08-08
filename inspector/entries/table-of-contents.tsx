import { defineEntry, select } from "../schema";
import { TocDemo } from "./toc-demo";

const VARIANTS = ["span", "single"] as const;

export const tableOfContentsEntry = defineEntry({
  slug: "table-of-contents",
  name: "Table of Contents",
  controls: {
    variant: select(VARIANTS, "span"),
  },
  render({ variant }) {
    // Scroll the article on the left — the active entry and rail marker track along.
    return <TocDemo variant={variant} />;
  },
});
