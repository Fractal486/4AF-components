import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import type { ComponentProps } from "react";
import { DocsCodePre } from "@/components/docs-code-block";
import { componentReferences, type ComponentReferenceName } from "@/lib/component-reference";
import { publicInstallCommand } from "@/lib/site";
import { cn } from "@/registry/lib/cn";

/** Code-block components whose block carries `title` in its tray's header strip. */
function titled(title: string) {
  function ReferenceCodePre(props: ComponentProps<typeof DocsCodePre>) {
    return <DocsCodePre {...props} title={title} className={cn(props.className, "my-0")} />;
  }
  return { pre: ReferenceCodePre };
}

const installComponents = titled("Install");
const usageComponents = titled("Usage");

export async function ComponentReference({ name }: { name: ComponentReferenceName }) {
  const reference = componentReferences[name];

  return (
    <div className="not-prose my-8 flex flex-col gap-4">
      <ServerCodeBlock lang="bash" code={publicInstallCommand(name)} components={installComponents} />
      <ServerCodeBlock lang="tsx" code={reference.usage} components={usageComponents} />
    </div>
  );
}
