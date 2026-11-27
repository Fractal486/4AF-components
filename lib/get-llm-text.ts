import { renderPlaceholder } from "fumadocs-core/mdx-plugins/remark-llms.runtime";
import type { source } from "@/lib/source";
import {
  componentCatalogMarkdown,
  componentCount,
} from "@/lib/component-catalog";
import { expandComponentMdx } from "@/lib/component-docs";
import { ARCHIVED_SKILL_CATALOG, HOSTED_SKILL_CATALOG, HOSTED_SKILL_PATH } from "@/lib/site";

export async function getLLMText(page: (typeof source)["$inferPage"]) {
  const text = await renderPlaceholder(await page.data.getText("processed"), {
    Cards: ({ children }) => children.replace(/^[ \t]+(?=- )/gmu, ""),
    Card: ({ attributes }) => {
      const { href, title, description } = attributes;
      // Local pages also have a Markdown export. Preserve fragments and external links.
      const target = typeof href === "string" && href.replace(/^(\/docs\/[\w/-]+)(?=[?#]|$)/u, "$1.md");
      const label = target ? `[${title}](${target})` : title;
      return `- ${label}${description ? ` — ${description}` : ""}`;
    },
  });
  const hosted = page.url === HOSTED_SKILL_PATH
    ? text.replaceAll(`](${ARCHIVED_SKILL_CATALOG})`, `](${HOSTED_SKILL_CATALOG}.md)`)
    : text;
  const processed = expandComponentMdx(
    hosted.replaceAll("<ComponentCount />", String(componentCount))
      .replaceAll("<ComponentCatalog />", componentCatalogMarkdown()),
  );

  const description = page.data.description ? `\n\n${page.data.description}` : "";
  return `# ${page.data.title} (${page.url})${description}\n\n${processed}`;
}
