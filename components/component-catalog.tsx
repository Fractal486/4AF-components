import { componentCategories, componentCount } from "@/lib/component-catalog";

export function ComponentCount() {
  return <>{componentCount}</>;
}

export function ComponentCatalog() {
  return (
    <div className="not-prose my-8 space-y-8">
      {componentCategories.map((category) => (
        <section key={category.name}>
          <h2 className="mb-3 text-xl font-semibold text-fd-foreground">{category.name}</h2>
          <div className="overflow-x-auto rounded-xl border border-fd-border">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-fd-muted/50 text-fd-muted-foreground">
                <tr>
                  <th className="w-40 border-b border-fd-border px-3 py-2.5 font-medium">
                    Install name
                  </th>
                  <th className="w-64 border-b border-fd-border px-3 py-2.5 font-medium">
                    Main API
                  </th>
                  <th className="border-b border-fd-border px-3 py-2.5 font-medium">
                    What it provides
                  </th>
                </tr>
              </thead>
              <tbody>
                {category.components.map((component) => (
                  <tr key={component.name} className="border-b border-fd-border/70 last:border-0">
                    <td className="px-3 py-3 align-top">
                      <a
                        href={`/docs/${component.name}`}
                        className="font-mono text-xs font-medium text-fd-foreground underline decoration-fd-border underline-offset-4 hover:decoration-fd-foreground"
                      >
                        {component.name}
                      </a>
                    </td>
                    <td className="px-3 py-3 align-top font-mono text-xs leading-5 text-fd-foreground">
                      {component.mainApi}
                    </td>
                    <td className="px-3 py-3 align-top leading-5 text-fd-muted-foreground">
                      {component.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
