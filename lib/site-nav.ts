import { existsSync } from "node:fs";
import { join } from "node:path";
import { componentCategories } from "./component-catalog";
import { source } from "./source";
import referenceMeta from "../content/docs/reference/meta.json";

export const REPOSITORY = "https://github.com/Fractal486/4AF-components";

export interface NavItem {
  title: string;
  href: string;
  /** The component's animated spacing blueprint, when one has been drawn. */
  blueprint?: string;
}

/**
 * Blueprints live at `public/blueprints/<category>/<component>.svg`, the category being its
 * catalog name in kebab case. Not every component has one yet, so check the file exists.
 */
function blueprintUrl(category: string, component: string) {
  const url = `/blueprints/${category.toLowerCase().replaceAll(" ", "-")}/${component}.svg`;
  return existsSync(join(process.cwd(), "public", url)) ? url : undefined;
}

export interface NavGroup {
  /** Omitted for the leading group, which needs no heading. */
  label?: string;
  items: NavItem[];
}

/**
 * The site rail: the overview, the reference pages, then every installable component in its
 * catalog category. Components come from the registry-derived catalog, so a new
 * registry item appears here once it has a category.
 */
export function siteNav(): NavGroup[] {
  return [
    { items: [{ title: "Overview", href: "/" }] },
    {
      label: "Reference",
      items: referenceMeta.pages.flatMap((slug) => {
        const page = source.getPage(["reference", slug]);
        return page ? [{ title: page.data.title, href: page.url }] : [];
      }),
    },
    ...componentCategories.map((category) => ({
      label: category.name,
      items: category.components.map((component) => ({
        title: component.title,
        href: `/docs/${component.name}`,
        blueprint: blueprintUrl(category.name, component.name),
      })),
    })),
  ];
}

/** The pages either side of `href` in rail order, for a page's previous/next links. */
export function siblings(href: string) {
  const flat = siteNav().flatMap((group) => group.items);
  const index = flat.findIndex((item) => item.href === href);
  return {
    previous: index > 0 ? flat[index - 1] : undefined,
    next: index >= 0 ? flat[index + 1] : undefined,
  };
}
