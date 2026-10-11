import { siteNav } from "@/lib/site-nav";
import { SITE_URL } from "@/lib/site";
import { source } from "@/lib/source";

export const revalidate = false;

/**
 * The entry point for agents without a clone: every page's Markdown address, grouped as in the
 * site rail, plus the install pattern. Generated from the same sources as the rail, so a new
 * component appears here once it has a docs page and a catalog category.
 */
export function GET() {
  const lines = [
    "# 4AF Components",
    "",
    "> A personal library of React components built on Base UI, installed with the shadcn CLI.",
    "",
    `Install a component: \`npx shadcn@latest add ${SITE_URL}/r/<name>.json\`. Its theme,`,
    "shared utilities, and component dependencies install with it.",
    "",
    "Every page is available as Markdown at the URLs below.",
    "",
    "## Overview",
    "",
    `- [Overview](${SITE_URL}/docs.md): What the library is and how to install from it.`,
  ];

  for (const group of siteNav()) {
    if (!group.label) continue;
    lines.push("", `## ${group.label}`, "");
    for (const item of group.items) {
      const page = source.getPage(item.href.replace(/^\/docs\/?/, "").split("/").filter(Boolean));
      const description = page?.data.description ? `: ${page.data.description}` : "";
      lines.push(`- [${item.title}](${SITE_URL}${item.href}.md)${description}`);
    }
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
