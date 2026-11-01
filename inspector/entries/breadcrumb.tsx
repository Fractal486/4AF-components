import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbCollapse,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/registry/ui/breadcrumb/breadcrumb";
import { bool, defineEntry, select } from "../schema";

export const breadcrumbEntry = defineEntry({
  slug: "breadcrumb",
  name: "Breadcrumb",
  controls: {
    size: select(["sm", "md"], "md", "Size"),
    collapse: bool(true, "Collapse middle"),
  },
  render({ size, collapse }) {
    return <BreadcrumbDemo size={size} collapse={collapse} />;
  },
});

function BreadcrumbDemo({ size, collapse }: { size: "sm" | "md"; collapse: boolean }) {
  const [state, setState] = useState({ collapse, expanded: false });
  if (state.collapse !== collapse) setState({ collapse, expanded: false });
  const middle = (
    <>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Docs</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Components</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Navigation</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
    </>
  );

  return (
    <Breadcrumb>
      <BreadcrumbList size={size}>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbCollapse open={!collapse || state.expanded} onOpenChange={(expanded) => setState({ collapse, expanded })}>
          {middle}
        </BreadcrumbCollapse>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
