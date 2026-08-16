import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { componentReferences, type ComponentReferenceName } from "@/lib/component-reference";

export async function ComponentReference({ name }: { name: ComponentReferenceName }) {
  const reference = componentReferences[name];
  const install = `pnpm 4af install ${name} --project <absolute-target-project>`;

  return (
    <div className="not-prose my-8 space-y-4">
      <div>
        <p className="mb-2 text-[15px] leading-5 font-semibold text-fd-foreground">
          Install
        </p>
        <ServerCodeBlock lang="bash" code={install} />
      </div>
      <div>
        <p className="mb-2 text-[15px] leading-5 font-semibold text-fd-foreground">
          Usage
        </p>
        <ServerCodeBlock lang="tsx" code={reference.usage} />
      </div>
    </div>
  );
}
