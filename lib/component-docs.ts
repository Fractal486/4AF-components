import { componentReferenceMarkdown } from "./component-reference.ts";

interface ComponentFrontmatter {
  title?: string;
  description?: string;
}

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseFrontmatter(source: string): {
  metadata: ComponentFrontmatter;
  body: string;
} {
  const match = source.match(frontmatterPattern);
  if (!match) return { metadata: {}, body: source };

  const metadata: ComponentFrontmatter = {};
  for (const line of match[1]!.split(/\r?\n/u)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key === "title") metadata.title = value;
    if (key === "description") metadata.description = value;
  }

  return { metadata, body: source.slice(match[0].length) };
}

/**
 * Turns the custom MDX components used by the site into Markdown that an agent can
 * consume without a React or Fumadocs runtime. Install and usage become ordinary,
 * separate fenced code blocks. Demos are not part of the MDX: the page shell renders them.
 */
export function expandComponentMdx(markdown: string) {
  return markdown
    .replace(/<ComponentReference\s+name="([^"]+)"\s*\/>/gu, (_match, name: string) =>
      componentReferenceMarkdown(name) ?? "",
    )
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

export function renderComponentPageMarkdown(source: string, name: string) {
  const { metadata, body } = parseFrontmatter(source);
  const title = metadata.title ?? name;
  const content = expandComponentMdx(body);

  return [
    `# ${title}`,
    metadata.description,
    content,
  ]
    .filter((section): section is string => Boolean(section))
    .join("\n\n");
}
