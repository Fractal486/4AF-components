import { fireEvent, render, screen } from "@testing-library/react";
import { SidebarDemo } from "./sidebar-demo";

describe("SidebarDemo split inbox header actions", () => {
  it("does not change the selected mail row when an action is clicked", () => {
    render(<SidebarDemo side="left" variant="split" collapsible="offcanvas" loading={false} />);

    const inboxRow = document.querySelector<HTMLButtonElement>(
      '[data-slot="sidebar-menu-button"]',
    );
    expect(inboxRow).toHaveAttribute("data-active");

    fireEvent.click(screen.getByRole("button", { name: "Compose" }));
    expect(inboxRow).toHaveAttribute("data-active");

    fireEvent.click(screen.getByRole("button", { name: "Search mail" }));
    expect(inboxRow).toHaveAttribute("data-active");
  });
});
