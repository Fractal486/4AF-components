import { siteNav } from "@/lib/site-nav";
import { SITE_URL } from "@/lib/site";
import { source } from "@/lib/source";

export const revalidate = false;
export const dynamic = "force-static";

/**
 * The entry point for agents: every page's Markdown address, grouped as in the
 * site rail, plus the install pattern. Generated from the same sources as the rail, so a new
 * component appears here once it has a docs page and a catalog category.
 */
export function GET() {
  const lines = [
    "# 4AF Components",
    "",
    "> A personal library of minimal React components with just enough motion, built on Base UI and installed with the shadcn CLI.",
    "",
    "Components install with the shadcn CLI, run in a project with a shadcn `components.json`",
    "(`npx shadcn@latest init` creates one). The theme, shared utilities, and component",
    "dependencies install with each component.",
    "",
    "```bash",
    "# List every component with its description and install URL",
    `npx shadcn@latest search ${SITE_URL}/r/registry.json -t ui`,
    "",
    "# Preview an install, then run it",
    `npx shadcn@latest add ${SITE_URL}/r/<name>.json --dry-run`,
    `npx shadcn@latest add ${SITE_URL}/r/<name>.json`,
    "```",
    "",
    "Optional: a 4AF agent skill packages this workflow and a component chooser. Download",
    `it from \`${SITE_URL}/api/agent-skill/download\` (a zip of the skill folder) or read`,
    `\`${SITE_URL}/docs/reference/agent-skill/skill.md\`.`,
    "",
    `Each component's documentation, including its install command and a usage example, is at`,
    `\`${SITE_URL}/docs/<name>.md\`. Every page is listed below.`,
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
