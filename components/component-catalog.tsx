import { componentCategories, componentCount } from "@/lib/component-catalog";
import { InlineLink } from "@/components/inline-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/ui/table/table";

/** The catalog's own page, whose contents come from the categories below rather than its MDX. */
export const COMPONENT_CATALOG_URL = "/docs/reference/components";

function categoryId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * The catalog's headings, for the page's contents. They are rendered here, not written in the
 * MDX, so Fumadocs never sees them; the page adds these to the headings it did collect.
 */
export const componentCatalogToc = componentCategories.map((category) => ({
  id: categoryId(category.name),
  title: category.name,
  level: 2,
}));

export function ComponentCount() {
  return <>{componentCount}</>;
}

export function ComponentCatalog() {
  return (
    <div className="not-prose my-8 space-y-8">
      {componentCategories.map((category) => (
        <section key={category.name}>
          <h2 id={categoryId(category.name)} className="mb-3 text-xl font-semibold text-foreground">
            {category.name}
          </h2>
          <Table className="min-w-[760px] [&_thead]:bg-surface [&_thead_th]:border-b-0" stickyHeader={false}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">
                    Install name
                  </TableHead>
                  <TableHead className="w-64">
                    Main API
                  </TableHead>
                  <TableHead>
                    What it provides
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.components.map((component) => (
                  <TableRow key={component.name}>
                    <TableCell className="align-top">
                      <InlineLink
                        href={`/docs/${component.name}`}
                        className="font-mono text-xs font-medium"
                      >
                        {component.name}
                      </InlineLink>
                    </TableCell>
                    <TableCell className="align-top font-mono text-xs leading-5">
                      {component.mainApi}
                    </TableCell>
                    <TableCell className="align-top leading-5 text-muted-foreground">
                      {component.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </Table>
        </section>
      ))}
    </div>
  );
}
