import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ComponentCatalog, ComponentCount } from "@/components/component-catalog";
import { ComponentReference } from "@/components/component-reference";
import { ComponentDemo } from "@/stories/component-demo";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
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
