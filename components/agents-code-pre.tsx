import Image from "next/image";
import type { ComponentProps } from "react";
import { DocsCodePre } from "@/components/docs-code-block";

/**
 * The agent skill page's code block, with the agents' logos in its header strip in place of the
 * language icon, at 20px. Served well above that size and not re-encoded: the optimiser would
 * recompress so small an image soft. `outline-none` drops the theme's image outline, which would
 * box in the logos.
 */
export function AgentsCodePre(props: ComponentProps<typeof DocsCodePre>) {
  return (
    <DocsCodePre
      {...props}
      icon={
        <Image src="/agents.png" alt="" width={365} height={160} unoptimized className="h-5 w-auto outline-none" />
      }
    />
  );
}
