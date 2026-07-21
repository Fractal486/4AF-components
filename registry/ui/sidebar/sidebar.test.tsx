import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { SidebarProvider, SidebarRail } from "./sidebar";

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
