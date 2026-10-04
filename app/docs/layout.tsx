import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      githubUrl="https://github.com/Fractal486/4AF-components"
      nav={{ title: "4AF Components" }}
      tree={source.getPageTree()}
    >
      {children}
    </DocsLayout>
  );
}
