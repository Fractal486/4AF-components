import { fireEvent, render, screen } from "@testing-library/react";
import { sidebarEntry, resolveSidebarVariant } from "./sidebar";
import { SidebarDemo } from "./sidebar-demo";

describe("SidebarDemo split inbox header actions", () => {
  it("uses the same button brand mark in the default layout", () => {
    render(<SidebarDemo variant="sidebar" collapsible="icon" loading={false} />);

    expect(screen.getByRole("button", { name: "Acme Inc" })).toHaveAttribute(
      "data-slot",
      "sidebar-rail-button",
    );
  });

  it("does not change the selected mail row when an action is clicked", () => {
    render(<SidebarDemo variant="split" collapsible="offcanvas" loading={false} />);

    const inboxRow = document.querySelector<HTMLButtonElement>(
      '[data-slot="sidebar-menu-button"]',
    );
    expect(inboxRow).toHaveAttribute("data-active");

    fireEvent.click(screen.getByRole("button", { name: "Compose" }));
    expect(inboxRow).toHaveAttribute("data-active");

    fireEvent.click(screen.getByRole("button", { name: "Search mail" }));
    expect(inboxRow).toHaveAttribute("data-active");
  });

  it("can remove the boxed preview frame for the fullscreen route", () => {
    const { container } = render(
      <SidebarDemo
        variant="sidebar"
        collapsible="icon"
        loading={false}
        fullscreen
      />,
    );

    expect(container.firstElementChild).toHaveClass("h-dvh");
    expect(container.firstElementChild).not.toHaveClass("rounded-lg");
  });

  it("splits the combined variants into layout and surface controls", () => {
    expect(sidebarEntry.controls.layout.options).toEqual(["default", "split"]);
    expect(sidebarEntry.controls.variant.options).toEqual(["default", "floating", "inset"]);
    expect(resolveSidebarVariant("default", "default")).toBe("sidebar");
    expect(resolveSidebarVariant("split", "floating")).toBe("split-floating");
    expect(resolveSidebarVariant("split", "inset")).toBe("split-inset");
  });
});
