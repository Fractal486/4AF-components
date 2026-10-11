import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import type { ComponentProps } from "react";
import { DocsCodePre } from "@/components/docs-code-block";
import { componentReferences, type ComponentReferenceName } from "@/lib/component-reference";
import { publicInstallCommand } from "@/lib/site";
import { cn } from "@/registry/lib/cn";

function ReferenceCodePre(props: ComponentProps<typeof DocsCodePre>) {
  return <DocsCodePre {...props} className={cn(props.className, "my-0")} />;
}

const codeComponents = { pre: ReferenceCodePre };

export async function ComponentReference({ name }: { name: ComponentReferenceName }) {
  const reference = componentReferences[name];

  return (
    <div className="not-prose my-8 space-y-4">
      <div>
        <p className="mb-2 text-[15px] leading-5 font-semibold text-fd-foreground">
          Install
        </p>
        <ServerCodeBlock lang="bash" code={publicInstallCommand(name)} components={codeComponents} />
      </div>
      <div>
        <p className="mb-2 text-[15px] leading-5 font-semibold text-fd-foreground">
          Usage
        </p>
        <ServerCodeBlock lang="tsx" code={reference.usage} components={codeComponents} />
      </div>
    </div>
  );
}
