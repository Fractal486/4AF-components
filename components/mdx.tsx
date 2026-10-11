import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { ComponentCatalog, ComponentCount } from "@/components/component-catalog";
import { ComponentReference } from "@/components/component-reference";
import { DocsCodePre } from "@/components/docs-code-block";
import { DocsHeading } from "@/components/docs-heading";
import { InlineLink } from "@/components/inline-link";
import { ComponentDemo } from "@/stories/component-demo";
import { cn } from "@/registry/lib/cn";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/ui/table/table";

function DocsTable({ className, ...props }: ComponentProps<"table">) {
  return (
    <Table
      {...props}
      className={cn("[&_thead]:bg-surface [&_thead_th]:border-b-0", className)}
      stickyHeader={false}
      wrapperClassName="not-prose my-6"
    />
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    a: InlineLink,
    h1: (props: ComponentProps<"h1">) => <DocsHeading as="h1" {...props} />,
    h2: (props: ComponentProps<"h2">) => <DocsHeading as="h2" {...props} />,
    h3: (props: ComponentProps<"h3">) => <DocsHeading as="h3" {...props} />,
    h4: (props: ComponentProps<"h4">) => <DocsHeading as="h4" {...props} />,
    h5: (props: ComponentProps<"h5">) => <DocsHeading as="h5" {...props} />,
    h6: (props: ComponentProps<"h6">) => <DocsHeading as="h6" {...props} />,
    pre: DocsCodePre,
    table: DocsTable,
    thead: TableHeader,
    tbody: TableBody,
    tfoot: TableFooter,
    tr: TableRow,
    th: TableHead,
    td: TableCell,
    caption: TableCaption,
    ComponentCatalog,
    ComponentCount,
    ComponentDemo,
    ComponentReference,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
