import { ReferenceCodeBlock } from "@/components/reference-code-block";
import { componentReferences, type ComponentReferenceName } from "@/lib/component-reference";

export function ComponentReference({ name }: { name: ComponentReferenceName }) {
  const reference = componentReferences[name];
  const install = `pnpm 4af install ${name} --project <absolute-target-project>`;

  return (
    <div className="not-prose my-8 space-y-4">
      <div>
        <p className="mb-2 text-[15px] leading-5 font-semibold text-fd-foreground">
          Install
        </p>
        <ReferenceCodeBlock language="bash" code={install} />
      </div>
      <div>
        <p className="mb-2 text-[15px] leading-5 font-semibold text-fd-foreground">
          Usage
        </p>
        <ReferenceCodeBlock language="tsx" code={reference.usage} />
      </div>
    </div>
  );
}
