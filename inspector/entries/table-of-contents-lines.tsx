import { defineEntry } from "../schema";
import { TocLinesDemo } from "./toc-demo";

export const tableOfContentsLinesEntry = defineEntry({
  slug: "table-of-contents-lines",
  name: "Table of Contents Lines",
  controls: {},
  render() {
    return <TocLinesDemo />;
  },
});
