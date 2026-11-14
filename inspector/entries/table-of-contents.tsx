import { bool, defineEntry, select } from "../schema";
import { TocDemo } from "./toc-demo";

const VARIANTS = ["span", "single"] as const;
const LABELS = ["always", "hover"] as const;

export const tableOfContentsEntry = defineEntry({
  slug: "table-of-contents",
  name: "Table of Contents",
  controls: {
    variant: select(VARIANTS, "span"),
    // `hover` leaves the rail and its marker alone on screen until the list is pointed at.
    labels: select(LABELS, "always"),
    scrollable: bool(false, "Scrollable"),
  },
  render({ variant, labels, scrollable }) {
    // Scroll the article on the left — the active entry and rail marker track along.
    return <TocDemo variant={variant} labels={labels} scrollable={scrollable} />;
  },
});
