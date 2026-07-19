import { defineEntry } from "../schema";
import { TocDemo } from "./toc-demo";

export const tableOfContentsEntry = defineEntry({
  slug: "table-of-contents",
  name: "Table of Contents",
  controls: {},
  render() {
    // Scroll the article on the left — the active entry and its rail marker track along.
    return <TocDemo />;
  },
});
