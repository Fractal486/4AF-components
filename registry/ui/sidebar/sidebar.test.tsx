import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import {
  SidebarHeader,
  SidebarHeaderButton,
  SidebarHeaderRow,
  Sidebar,
  SidebarPanel,
  SidebarProvider,
  SidebarRail,
  SidebarRailButton,
  SidebarTrigger,
  useSidebar,
} from "./sidebar";

function MobileProbe() {
  const { isMobile } = useSidebar();
  return <output>{isMobile ? "mobile" : "desktop"}</output>;
}

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

describe("cancellable sidebar controls", () => {
  it("uses panel-left while open and panel-right while closed", () => {
    const { unmount } = render(
      <SidebarProvider persist={false}>
        <SidebarTrigger />
      </SidebarProvider>,
    );

    const openTrigger = screen.getByRole("button", { name: "Toggle sidebar" });
    expect(openTrigger.querySelector(".lucide-panel-left")).toBeInTheDocument();
    expect(openTrigger.querySelector(".lucide-panel-right")).toBeNull();

    unmount();
    render(
      <SidebarProvider defaultOpen={false} persist={false}>
        <SidebarTrigger />
      </SidebarProvider>,
    );

    const closedTrigger = screen.getByRole("button", { name: "Toggle sidebar" });
    expect(closedTrigger.querySelector(".lucide-panel-left")).toBeNull();
    expect(closedTrigger.querySelector(".lucide-panel-right")).toBeInTheDocument();
  });

  it("does not toggle when a SidebarTrigger consumer prevents the click", () => {
    const onOpenChange = vi.fn();
    render(
      <SidebarProvider onOpenChange={onOpenChange} persist={false}>
        <SidebarTrigger onClick={(event) => event.preventDefault()} />
      </SidebarProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("does not select a split panel when a rail-button consumer prevents the click", () => {
    const onActivePanelChange = vi.fn();
    render(
      <SidebarProvider persist={false}>
        <Sidebar
          variant="split"
          collapsible="none"
          defaultActivePanel="first"
          onActivePanelChange={onActivePanelChange}
          rail={
            <SidebarRailButton
              value="second"
              aria-label="Second panel"
              onClick={(event) => event.preventDefault()}
            >
              Two
            </SidebarRailButton>
          }
        >
          <SidebarPanel value="first">First</SidebarPanel>
          <SidebarPanel value="second">Second</SidebarPanel>
        </Sidebar>
      </SidebarProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Second panel" }));
    expect(onActivePanelChange).not.toHaveBeenCalled();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.queryByText("Second")).toBeNull();
  });
});

describe("SidebarProvider environment behavior", () => {
  it("tracks matchMedia changes and removes its listener on unmount", async () => {
    const listeners = new Set<() => void>();
    let matches = true;
    const media = {
      get matches() {
        return matches;
      },
      media: "(max-width: 767px)",
      onchange: null,
      addEventListener: vi.fn((_type: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_type: string, listener: () => void) =>
        listeners.delete(listener),
      ),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => media as unknown as MediaQueryList),
    });

    const { unmount } = render(
      <SidebarProvider persist={false}>
        <MobileProbe />
      </SidebarProvider>,
    );
    await waitFor(() => expect(screen.getByText("mobile")).toBeInTheDocument());

    matches = false;
    act(() => {
      for (const listener of listeners) listener();
    });
    expect(screen.getByText("desktop")).toBeInTheDocument();

    unmount();
    expect(media.removeEventListener).toHaveBeenCalled();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it("toggles with Ctrl-B", () => {
    const onOpenChange = vi.fn();
    render(
      <SidebarProvider onOpenChange={onOpenChange} persist={false}>
        <MobileProbe />
      </SidebarProvider>,
    );

    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(false);
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
