import { componentCategories, componentCount } from "@/lib/component-catalog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/ui/table/table";

export function ComponentCount() {
  return <>{componentCount}</>;
}

export function ComponentCatalog() {
  return (
    <div className="not-prose my-8 space-y-8">
      {componentCategories.map((category) => (
        <section key={category.name}>
          <h2 className="mb-3 text-xl font-semibold text-foreground">{category.name}</h2>
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
                      <a
                        href={`/docs/${component.name}`}
                        className="font-mono text-xs font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                      >
                        {component.name}
                      </a>
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
