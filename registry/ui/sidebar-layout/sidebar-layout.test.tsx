import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SidebarLayout } from "./sidebar-layout";

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
});
