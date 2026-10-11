"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Link as LinkIcon } from "lucide-react";
import { cn } from "@/registry/lib/cn";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type DocsHeadingProps = ComponentPropsWithoutRef<"h2"> & { as?: HeadingTag };

export function DocsHeading({ as: Tag = "h2", id, className, children, ...props }: DocsHeadingProps) {
  if (!id) return <Tag className={className} {...props}>{children}</Tag>;

  return (
    <Tag
      {...props}
      id={id}
      className={cn("group/heading flex scroll-m-28 items-center gap-1", className)}
    >
      <a data-card="" href={`#${id}`}>{children}</a>
      <CopyButton
        icon={<LinkIcon />}
        size="xs"
        variant="ghost"
        labels={{ copy: "Copy section link", copied: "Section link copied", failed: "Couldn't copy section link" }}
        value={() => {
          const url = new URL(window.location.href);
          url.hash = id;
          return url.href;
        }}
        className="not-prose shrink-0 text-muted-foreground opacity-0 transition-[opacity] duration-(--duration-fast) group-hover/heading:opacity-100 group-focus-within/heading:opacity-100 pointer-coarse:opacity-100"
      />
    </Tag>
  );
}
