import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import {
  SidebarHeader,
  SidebarHeaderButton,
  SidebarHeaderRow,
  SidebarProvider,
  SidebarRail,
} from "./sidebar";

describe("SidebarRail", () => {
  it("runs a consumer click handler and still toggles the sidebar", () => {
    const onClick = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <SidebarProvider onOpenChange={onOpenChange} persist={false}>
        <SidebarRail onClick={onClick} />
      </SidebarProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle sidebar" }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not persist a controlled toggle that its owner rejects", async () => {
    document.cookie = "sidebar_state=; path=/; max-age=0";
    const onOpenChange = vi.fn();

    render(
      <SidebarProvider open onOpenChange={onOpenChange}>
        <SidebarRail />
      </SidebarProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle sidebar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(document.cookie).not.toContain("sidebar_state=false"));
  });
});

describe("SidebarHeaderButton", () => {
  it("fills the header on its own", () => {
    render(
      <SidebarProvider persist={false}>
        <SidebarHeader>
          <SidebarHeaderButton>Compose</SidebarHeaderButton>
        </SidebarHeader>
      </SidebarProvider>,
    );

    const button = screen.getByRole("button", { name: "Compose" });
    expect(button.className).toContain("w-full");
    expect(button.className).toContain("mt-2");
    expect(button.className).not.toContain("flex-1");
  });

  it("splits the row with a second button, and drops the margin each carried alone", () => {
    const { container } = render(
      <SidebarProvider persist={false}>
        <SidebarHeader>
          <SidebarHeaderRow>
            <SidebarHeaderButton>Compose</SidebarHeaderButton>
            <SidebarHeaderButton variant="outline">Search</SidebarHeaderButton>
          </SidebarHeaderRow>
        </SidebarHeader>
      </SidebarProvider>,
    );

    // The row owns the spacing below the title now, so one or two buttons sit the
    // same distance down.
    expect(container.querySelector("[data-slot=sidebar-header-row]")?.className).toContain(
      "mt-2",
    );

    for (const name of ["Compose", "Search"]) {
      const button = screen.getByRole("button", { name });
      expect(button.className).toContain("flex-1");
      expect(button.className).not.toContain("mt-2");
      // `flex-1` has to survive the merge with the Button's own `shrink-0`, or both
      // buttons hold their label width and overflow the sidebar.
      expect(button.classList.contains("shrink-0")).toBe(false);
    }
  });

  it("keeps each button's own variant inside the row", () => {
    render(
      <SidebarProvider persist={false}>
        <SidebarHeaderRow>
          <SidebarHeaderButton>Compose</SidebarHeaderButton>
          <SidebarHeaderButton variant="outline">Search</SidebarHeaderButton>
        </SidebarHeaderRow>
      </SidebarProvider>,
    );

    expect(screen.getByRole("button", { name: "Compose" })).toHaveAttribute(
      "data-variant",
      "primary",
    );
    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute(
      "data-variant",
      "outline",
    );
  });
});
