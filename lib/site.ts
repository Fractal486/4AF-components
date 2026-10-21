/**
 * Where the public site lives. The registry, the Markdown docs, and `llms.txt` are all served
 * from here, so this is the one value to change if the library moves.
 *
 * Plain constants with relative imports only: `lib/component-reference.ts` imports this file,
 * and the docs tests read both outside Next.
 */
export const SITE_URL = "https://4af.selfsimilar.dev";

/** Next replaces nested metadata fields, so keep the agent link alongside each canonical. */
export function pageAlternates(pathname: string) {
  return {
    canonical: `${SITE_URL}${pathname}`,
    types: { "text/plain": `${SITE_URL}/llms.txt` },
  };
}

/** The registry's address template, for `shadcn registry add @4af=…`. */
export const REGISTRY_TEMPLATE = `${SITE_URL}/r/{name}.json`;

/** The address a registry item is installed from, e.g. `…/r/button.json`. */
export function registryItemUrl(name: string) {
  return `${SITE_URL}/r/${name}.json`;
}

/** The install command for one registry item. Works in any shadcn project, with no setup. */
export function publicInstallCommand(name: string) {
  return `npx shadcn@latest add ${registryItemUrl(name)}`;
}

/**
 * Installs the 4AF agent skill with the skills.sh CLI, from the library's own repository.
 * `--skill` picks it out: the repository also holds the blueprint-drawing skill used to
 * build the site.
 */
export const SKILL_INSTALL_COMMAND = "npx skills add Fractal486/4AF-components --skill 4af-components";

/** A prompt for a coding agent, copied from the landing page. */
export const AGENT_PROMPT = [
  `Use the 4AF React component library (${SITE_URL}).`,
  `Start by reading ${SITE_URL}/llms.txt: it has the install commands and links every`,
  "component's documentation as Markdown.",
  `Before using a component, read its page at ${SITE_URL}/docs/<name>.md.`,
  `Install components with the shadcn CLI: npx shadcn@latest add ${SITE_URL}/r/<name>.json`,
  "(run it with --dry-run first to preview the changes).",
  `Optionally, install the 4AF agent skill, which packages this workflow and a component chooser: ${SKILL_INSTALL_COMMAND}`,
].join(" ");
