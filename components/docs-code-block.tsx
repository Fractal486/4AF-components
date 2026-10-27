"use client";

import { useRef, type CSSProperties, type HTMLAttributes } from "react";
import { Pre, type CodeBlockProps } from "fumadocs-ui/components/codeblock";
import { cn } from "@/registry/lib/cn";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";

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
        className="cursor-default"
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

/**
 * Fumadocs' code block markup and classes, with the code in a Scroll Area so snippets carry the
 * library scrollbar. Fumadocs' own `CodeBlock` hard-codes its scrolling element (focusable, with
 * a native scrollbar), so a Scroll Area nested in it would be a second tab stop; this renders
 * the same figure with the Scroll Area's viewport as the one scrolling, focusable region.
 */
export function DocsCodeBlock({
  title,
  icon,
  allowCopy = true,
  keepBackground = false,
  viewportProps = {},
  className,
  children,
  ...props
}: Omit<CodeBlockProps, "Actions">) {
  const copyable = allowCopy !== false && allowCopy !== "false";
  const { className: viewportClassName, style: viewportStyle, ...viewportRest } = viewportProps;

  return (
    <figure
      dir="ltr"
      {...props}
      tabIndex={-1}
      className={cn(
        "shiki not-prose relative my-4 overflow-hidden rounded-[8px] border bg-muted text-sm dark:bg-surface-raised",
        keepBackground && "bg-(--shiki-light-bg) dark:bg-(--shiki-dark-bg)",
        className,
      )}
    >
      {title ? (
        <div className="flex h-9.5 items-center gap-2 border-b px-4 text-fd-muted-foreground">
          {typeof icon === "string" ? (
            <div className="[&_svg]:size-3.5" dangerouslySetInnerHTML={{ __html: icon }} />
          ) : (
            icon
          )}
          <figcaption className="flex-1 truncate">{title}</figcaption>
          {copyable ? <CodeActions className="-me-2" /> : null}
        </div>
      ) : copyable ? (
        <CodeActions className="absolute top-3 right-2 z-2 rounded-lg" />
      ) : null}
      <ScrollArea
        orientation="both"
        className="max-h-[600px]"
        viewportClassName={cn("fd-scroll-container py-3.5 text-[0.8125rem]", viewportClassName)}
        viewportProps={{
          ...viewportRest,
          role: "region",
          style: {
            "--padding-right": title ? undefined : "calc(var(--spacing) * 8)",
            counterSet: props["data-line-numbers"]
              ? `line ${Number(props["data-line-numbers-start"] ?? 1) - 1}`
              : undefined,
            ...viewportStyle,
          } as CSSProperties,
        }}
      >
        {children}
      </ScrollArea>
    </figure>
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
