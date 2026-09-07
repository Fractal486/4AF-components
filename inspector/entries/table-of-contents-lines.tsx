import { defineEntry, select } from "../schema";
import { TocLinesDemo } from "./toc-demo";

const LABELS = ["always", "hover"] as const;

export const tableOfContentsLinesEntry = defineEntry({
  slug: "table-of-contents-lines",
  name: "Table of Contents Lines",
  controls: {
    // `hover` is the reason the rules exist: idle, the list is only its rules, and the
    // labels arrive when it is pointed at or focused.
    labels: select(LABELS, "always"),
  },
  render({ labels }) {
    return <TocLinesDemo labels={labels} />;
  },
});
