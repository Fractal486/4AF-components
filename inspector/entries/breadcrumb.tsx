import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbCollapse,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbSibling,
  BreadcrumbSiblings,
  type BreadcrumbSeparatorKind,
} from "@/registry/ui/breadcrumb/breadcrumb";
import { Button } from "@/registry/ui/button/button";
import { bool, defineEntry, select, withIcons } from "../schema";
import { BREADCRUMB_COLLAPSE_ICONS, BREADCRUMB_SEPARATOR_ICONS } from "../setting-icons";

export const breadcrumbEntry = defineEntry({
  slug: "breadcrumb",
  name: "Breadcrumb",
  controls: {
    size: select(["sm", "md"], "md", "Size"),
    separator: withIcons(select(["slash", "chevron", "line", "dot"], "chevron", "Separator"), BREADCRUMB_SEPARATOR_ICONS),
    collapse: withIcons(select(["none", "expand", "menu"], "expand", "Collapse middle"), BREADCRUMB_COLLAPSE_ICONS),
    // A menu row can't hold a sibling menu, so the menu collapse omits them.
    siblings: bool(true, "Sibling pages", (values) => values.collapse === "menu"),
  },
  render({ size, separator, collapse, siblings }) {
    return <BreadcrumbDemo size={size} separator={separator} collapse={collapse} siblings={siblings} />;
  },
});

/** Each section's pages; choosing a sibling section opens its first page. */
const SECTIONS = {
  Forms: "Checkbox",
  Navigation: "Breadcrumb",
  Overlays: "Dialog",
} as const;
type Section = keyof typeof SECTIONS;

function BreadcrumbDemo({ size, separator, collapse, siblings }: {
  size: "sm" | "md";
  separator: BreadcrumbSeparatorKind;
  collapse: "none" | "expand" | "menu";
  siblings: boolean;
}) {
  // Turning sibling pages on expands the trail, since their menu sits on a collapsed crumb.
  const [state, setState] = useState({ collapse, siblings, expanded: false });
  if (state.collapse !== collapse || state.siblings !== siblings) {
    setState({ collapse, siblings, expanded: siblings && !state.siblings });
  }
  const [section, setSection] = useState<Section>("Navigation");
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
        <BreadcrumbLink href="#">{section}</BreadcrumbLink>
        {siblings ? (
          <BreadcrumbSiblings label="Component sections">
            {(Object.keys(SECTIONS) as Section[]).map((name) => (
              <BreadcrumbSibling
                key={name}
                href="#"
                current={name === section}
                onClick={(event) => {
                  event.preventDefault();
                  setSection(name);
                }}
              >
                {name}
              </BreadcrumbSibling>
            ))}
          </BreadcrumbSiblings>
        ) : null}
      </BreadcrumbItem>
      <BreadcrumbSeparator />
    </>
  );

  return (
    <div className="flex max-w-full flex-col items-center gap-6">
      <Breadcrumb>
        <BreadcrumbList size={size} separator={separator}>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbCollapse
            variant={collapse === "menu" ? "menu" : "expand"}
            open={collapse === "none" || state.expanded}
            onOpenChange={(expanded) => setState({ collapse, siblings, expanded })}
          >
            {middle}
          </BreadcrumbCollapse>
          <BreadcrumbItem>
            <BreadcrumbPage>{SECTIONS[section]}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {collapse === "expand" ? (
        <Button size="sm" variant="outline-ghost"
          onClick={() => setState({ collapse, siblings, expanded: !state.expanded })}>
          {state.expanded ? "Collapse" : "Expand"}
        </Button>
      ) : null}
    </div>
  );
}
