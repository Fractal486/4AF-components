import { source } from "@/lib/source";
import {
  componentCatalogMarkdown,
  componentCount,
} from "@/lib/component-catalog";
import { expandComponentMdx } from "@/lib/component-docs";

export async function getLLMText(page: (typeof source)["$inferPage"]) {
  const processed = expandComponentMdx(
    (await page.data.getText("processed"))
      .replaceAll("<ComponentCount />", String(componentCount))
      .replaceAll("<ComponentCatalog />", componentCatalogMarkdown()),
  );

  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}
