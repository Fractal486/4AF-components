import { render } from "@testing-library/react";
import { createPortal } from "react-dom";
import { describe, expect, it } from "vitest";
import {
  SIDEBAR_LAYOUT_RAIL_SLOT_ID,
  SidebarLayout,
  useSidebarLayoutRailSlot,
} from "./sidebar-layout";

describe("SidebarLayout", () => {
  it("keeps the app frame fixed while the content area owns page scrolling", () => {
    const { container } = render(
      <SidebarLayout sidebar={<aside>Sidebar</aside>}>
        <div>Page content</div>
      </SidebarLayout>,
    );

    expect(container.querySelector('[data-slot="sidebar-wrapper"]')).toHaveClass(
      "h-svh",
      "overflow-hidden",
    );
    expect(container.querySelector('[data-slot="sidebar-inset"]')).toHaveClass(
      "min-h-0",
      "overflow-hidden",
    );
    expect(container.querySelector('[data-slot="sidebar-layout-content"]')).toHaveClass(
      "min-h-0",
      "overflow-y-auto",
    );
  });

  it("puts the rail slot beside the scroll container, not inside it", () => {
    // A rail inside the scrolling column can only ever be as tall as the viewport minus
    // however far the page has scrolled, and its footer scrolls away with the content.
    const { container } = render(
      <SidebarLayout sidebar={<aside>Sidebar</aside>}>
        <div>Page content</div>
      </SidebarLayout>,
    );

    const content = container.querySelector('[data-slot="sidebar-layout-content"]');
    const rail = container.querySelector('[data-slot="sidebar-layout-rail"]');
    expect(rail).not.toBeNull();
    expect(rail?.parentElement).toBe(content?.parentElement);
    // `contents`, so whatever portals in is a direct flex child of the row.
    expect(rail).toHaveClass("contents");
    expect(rail).toHaveAttribute("id", SIDEBAR_LAYOUT_RAIL_SLOT_ID);
  });

  it("publishes the slot to the page it renders, which cannot look it up by id", () => {
    // The page renders in the same pass that first commits the shell, so at that point
    // the slot element is not in the document yet.
    function RailPage() {
      const slot = useSidebarLayoutRailSlot();
      return slot ? createPortal(<div data-testid="rail">Rail</div>, slot) : null;
    }

    const { container } = render(
      <SidebarLayout sidebar={<aside>Sidebar</aside>}>
        <RailPage />
      </SidebarLayout>,
    );

    const rail = container.querySelector('[data-slot="sidebar-layout-rail"]');
    expect(rail?.querySelector('[data-testid="rail"]')).not.toBeNull();
  });

  it("offers no slot when there is no shell above", () => {
    function Probe() {
      return <span data-testid="probe">{String(useSidebarLayoutRailSlot())}</span>;
    }

    const { getByTestId } = render(<Probe />);
    expect(getByTestId("probe")).toHaveTextContent("null");
  });
});
