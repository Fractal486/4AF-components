import { source } from "@/lib/source";
import {
  componentCatalogMarkdown,
  componentCount,
} from "@/lib/component-catalog";
import { expandComponentMdx } from "@/lib/component-docs";

/** Fumadocs' processed text appends each heading's anchor, e.g. `## API [#api]`. */
const HEADING_ANCHOR = /^(#{1,6} .*?) \[#[^\]]+\]$/gmu;

export async function getLLMText(page: (typeof source)["$inferPage"]) {
  const processed = expandComponentMdx(
    (await page.data.getText("processed"))
      .replaceAll("<ComponentCount />", String(componentCount))
      .replaceAll("<ComponentCatalog />", componentCatalogMarkdown()),
  ).replace(HEADING_ANCHOR, "$1");

  const description = page.data.description ? `\n\n${page.data.description}` : "";
  return `# ${page.data.title} (${page.url})${description}\n\n${processed}`;
}
