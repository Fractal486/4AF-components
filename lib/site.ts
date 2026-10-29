/**
 * Where the public site lives. The registry, the Markdown docs, and `llms.txt` are all served
 * from here. If the library moves, update registry.json and the written guides' absolute
 * URLs as well as this constant.
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

/** Install one registry item into a configured shadcn project without a namespace registration. */
export function publicInstallCommand(name: string) {
  return `npx shadcn@latest add ${registryItemUrl(name)}`;
}

/**
 * Installs the 4AF agent skill with the skills.sh CLI, from the library's own repository.
 * `--skill` picks it out: the repository also holds the blueprint-drawing skill used to
 * build the site.
 */
export const SKILL_INSTALL_COMMAND = "npx skills add Fractal486/4AF-components --skill 4af-components";

/** The agents' entry point, copied from the landing page's "For agents" button. */
export const LLMS_TXT_URL = `${SITE_URL}/llms.txt`;
