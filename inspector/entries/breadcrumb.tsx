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
          {/* Remounted when toggled, so switching the control back to collapsed starts closed. */}
          {collapse ? <BreadcrumbCollapse key="collapse">{middle}</BreadcrumbCollapse> : middle}
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  },
});
