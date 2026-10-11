/**
 * Where the public site lives. The registry, the Markdown docs, and `llms.txt` are all served
 * from here, so this is the one value to change if the library moves.
 *
 * Plain constants with an explicit `.ts` import path: `scripts/4af.ts` runs under Node's type
 * stripping and imports this file directly.
 */
export const SITE_URL = "https://4af.selfsimilar.dev";

/** The address a registry item is installed from, e.g. `…/r/button.json`. */
export function registryItemUrl(name: string) {
  return `${SITE_URL}/r/${name}.json`;
}

/** The public install command for one registry item. */
export function publicInstallCommand(name: string) {
  return `npx shadcn@latest add ${registryItemUrl(name)}`;
}

/** The install command from a clone of the repository, with the CLI's checks. */
export function repositoryInstallCommand(name: string) {
  return `pnpm 4af install ${name} --project <absolute-target-project>`;
}
