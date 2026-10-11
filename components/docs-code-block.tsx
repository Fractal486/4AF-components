"use client";

import { useRef, type HTMLAttributes } from "react";
import { CodeBlock, Pre, type CodeBlockProps } from "fumadocs-ui/components/codeblock";
import { cn } from "@/registry/lib/cn";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";

function CodeActions({ className }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cn("relative isolate flex items-center", className, "text-muted-foreground backdrop-blur-none")}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-5 -left-10 -right-5 -z-10 bg-muted backdrop-blur-md [mask-image:linear-gradient(to_right,transparent,black_40%),linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] [mask-composite:intersect] dark:bg-surface-raised"
      />
      <CopyButton
        size="xs"
        variant="ghost"
        value={() => {
          const pre = ref.current?.closest("figure")?.querySelector("pre");
          if (!pre) throw new Error("Code block content is unavailable.");
          // Copy just this snippet, omitting annotations excluded by Fumadocs.
          const copy = pre.cloneNode(true) as HTMLPreElement;
          copy.querySelectorAll(".nd-copy-ignore").forEach((node) => node.replaceWith("\n"));
          return copy.textContent ?? "";
        }}
      />
    </div>
  );
}

const renderCodeActions: NonNullable<CodeBlockProps["Actions"]> = (props) => (
  <CodeActions {...props} />
);

export function DocsCodeBlock({ className, allowCopy = true, ...props }: CodeBlockProps) {
  return (
    <CodeBlock
      {...props}
      className={cn("rounded-[8px] bg-muted dark:bg-surface-raised", className)}
      allowCopy={false}
      Actions={allowCopy === false || allowCopy === "false" ? undefined : renderCodeActions}
    />
  );
}

/** Preserves highlighted code and metadata from MDX and server-generated snippets. */
export function DocsCodePre({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  return (
    <DocsCodeBlock {...props}>
      <Pre>{children}</Pre>
    </DocsCodeBlock>
  );
}
