"use client";

import { useRef, type CSSProperties, type HTMLAttributes } from "react";
import { Pre, type CodeBlockProps } from "fumadocs-ui/components/codeblock";
import { cn } from "@/registry/lib/cn";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";

/** Lucide's copy glyph with the front sheet filled, so the copy reads as the solid one. */
const COPY_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="8" y="8" width="14" height="14" rx="2" fill="currentColor" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

/** A small copy button for the tray's header strip. */
function CodeActions({ className }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cn("flex items-center", className)}
    >
      <CopyButton
        size="xs"
        variant="plain"
        icon={COPY_ICON}
        className="cursor-default text-muted-foreground hover:text-foreground"
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
 *
 * Two layers: a muted tray, 4px deep, holding the code on the page colour in a bordered inner
 * box (4px corners inside the tray's 8px). The tray extends above the box into a header strip
 * with the language icon, the title, and the copy button.
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
        "shiki not-prose relative my-4 rounded-[8px] bg-muted p-1 text-sm dark:bg-surface",
        className,
      )}
    >
      {/* The tray reaches up into a header strip: the language icon and title on the left, the
          copy button on the right. */}
      {title || icon || copyable ? (
        <div className="flex h-7 items-center gap-1.5 ps-1.5 pe-0.5 pb-1 text-xs text-muted-foreground [&_svg]:size-3.5">
          {typeof icon === "string" ? (
            <div dangerouslySetInnerHTML={{ __html: icon }} />
          ) : (
            icon
          )}
          <figcaption className="flex-1 truncate font-mono">{title}</figcaption>
          {copyable ? <CodeActions /> : null}
        </div>
      ) : null}
      <ScrollArea
        orientation="both"
        className={cn(
          "max-h-[600px] rounded-[4px] border bg-background",
          keepBackground && "bg-(--shiki-light-bg) dark:bg-(--shiki-dark-bg)",
        )}
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
export function DocsCodePre({ children, ...props }: HTMLAttributes<HTMLPreElement> & Pick<CodeBlockProps, "icon">) {
  return (
    <DocsCodeBlock {...props}>
      <Pre>{children}</Pre>
    </DocsCodeBlock>
  );
}
