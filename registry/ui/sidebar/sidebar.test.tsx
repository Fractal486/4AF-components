import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createRef, useState } from "react";
import {
  SidebarHeader,
  SidebarHeaderButton,
  SidebarHeaderRow,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuCollapsible,
  SidebarMenuCollapsibleContent,
  SidebarMenuCollapsibleTrigger,
  Sidebar,
  SidebarPanel,
  SidebarProvider,
  SidebarRail,
  SidebarRailButton,
  SidebarTabs,
  SidebarTabsList,
  SidebarTabsPanel,
  SidebarTabsTab,
  SidebarTrigger,
  useSidebar,
} from "./sidebar";

function MobileProbe() {
  const { isMobile } = useSidebar();
  return <output>{isMobile ? "mobile" : "desktop"}</output>;
}

describe("offcanvas sidebar keyboard access", () => {
  function Navigation({ open, collapsible = "offcanvas" }: { open: boolean; collapsible?: "offcanvas" | "icon" | "none" }) {
    return (
      <SidebarProvider open={open} persist={false}>
        <SidebarTrigger />
        <Sidebar collapsible={collapsible}>
          <a href="/projects">Projects</a>
          <SidebarRail />
        </Sidebar>
        <button>After navigation</button>
      </SidebarProvider>
    );
  }

  it("skips closed navigation and makes it reachable again when expanded", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Navigation open={false} />);
    expect(screen.queryByRole("link", { name: "Projects" })).not.toBeInTheDocument();
    await user.tab();
    expect(document.activeElement).toHaveAttribute("data-slot", "sidebar-trigger");
    await user.tab();
    expect(screen.getByRole("button", { name: "After navigation" })).toHaveFocus();
    // The edge handle explicitly remains visible even under the hidden content.
    expect(document.querySelector('[data-slot="sidebar-rail"]')).toHaveClass("visible");

    rerender(<Navigation open />);
    const link = screen.getByRole("link", { name: "Projects" });
    link.focus();
    expect(link).toHaveFocus();
    rerender(<Navigation open={false} />);
    expect(document.activeElement).toHaveAttribute("data-slot", "sidebar-trigger");
  });

  it.each(["icon", "none"] as const)("keeps %s navigation available when the provider is collapsed", (collapsible) => {
    render(<Navigation open={false} collapsible={collapsible} />);
    expect(screen.getByRole("link", { name: "Projects" })).toBeVisible();
  });
});

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

  it("drops the handle for a panel whose owner has pinned it", () => {
    // A controlled `open` its owner never changes makes the strip a control that does
    // nothing. An inert toggle reads as breakage; an absent one reads as "not available".
    const { rerender } = render(
      <SidebarProvider persist={false}>
        <Sidebar variant="split" rail={<div>Rail</div>}>
          Panel
        </Sidebar>
      </SidebarProvider>,
    );

    expect(screen.getByRole("button", { name: "Toggle sidebar" })).toBeInTheDocument();

    rerender(
      <SidebarProvider persist={false}>
        <Sidebar variant="split" rail={<div>Rail</div>} hideCollapseHandle>
          Panel
        </Sidebar>
      </SidebarProvider>,
    );

    expect(screen.queryByRole("button", { name: "Toggle sidebar" })).not.toBeInTheDocument();
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
    expect(button.className).not.toContain("flex-auto");
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
      expect(button.className).toContain("flex-auto");
      expect(button.className).not.toContain("mt-2");
      // `flex-auto` has to survive the merge with the Button's own `shrink-0`, or both
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

describe("Sidebar button geometry", () => {
  it("uses the compact and medium shared radius tiers for menu controls", () => {
    render(
      <SidebarProvider persist={false}>
        <SidebarMenuButton size="sm">Compact</SidebarMenuButton>
        <SidebarMenuButton>Default</SidebarMenuButton>
        <SidebarMenuButton size="lg">Large</SidebarMenuButton>
      </SidebarProvider>,
    );

    expect(screen.getByRole("button", { name: "Compact" })).toHaveClass("rounded-[6px]");
    expect(screen.getByRole("button", { name: "Default" })).toHaveClass("rounded-[8px]");
    expect(screen.getByRole("button", { name: "Large" })).toHaveClass("rounded-[8px]");
  });
});

describe("SidebarMenuCollapsible", () => {
  it.each([false, true])("toggles only the section from the separate chevron (page active: %s)", async (isActive) => {
    const user = userEvent.setup();
    const selectPage = vi.fn();
    render(<SidebarProvider persist={false}>
      <SidebarMenuCollapsible defaultOpen>
        <SidebarMenuCollapsibleTrigger isActive={isActive} onClick={selectPage}>Folders</SidebarMenuCollapsibleTrigger>
        <SidebarMenuCollapsibleContent>Children</SidebarMenuCollapsibleContent>
      </SidebarMenuCollapsible>
    </SidebarProvider>);
    const page = screen.getByRole("button", { name: "Folders" });
    const toggle = screen.getByRole("button", { name: "Toggle section" });
    expect(page).not.toContainElement(toggle);
    await user.click(toggle);
    expect(page).toHaveAttribute("aria-expanded", "false");
    expect(selectPage).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(page).toHaveAttribute("aria-expanded", "true");
    expect(selectPage).not.toHaveBeenCalled();
    expect(page.hasAttribute("data-active")).toBe(isActive);
  });

  it.each([false, true])("selects an inactive page and keeps its section open (initial open: %s)", async (defaultOpen) => {
    const user = userEvent.setup();
    function Pages() {
      const [active, setActive] = useState(false);
      return <SidebarProvider persist={false}>
        <SidebarMenuCollapsible defaultOpen={defaultOpen}>
          <SidebarMenuCollapsibleTrigger isActive={active} onClick={() => setActive(true)}>Folders</SidebarMenuCollapsibleTrigger>
          <SidebarMenuCollapsibleContent>Children</SidebarMenuCollapsibleContent>
        </SidebarMenuCollapsible>
        <button onClick={() => setActive(false)}>Other page</button>
      </SidebarProvider>;
    }
    render(<Pages />);
    const trigger = screen.getByRole("button", { name: "Folders" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("data-active");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Other page" }));
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("data-active");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("preserves the panel ref and mounted content across controlled reversals", async () => {
    const ref = createRef<HTMLDivElement>();
    const view = (open: boolean) => (
      <SidebarProvider persist={false}>
        <SidebarMenu>
          <SidebarMenuCollapsible open={open}>
            <SidebarMenuCollapsibleTrigger>Projects</SidebarMenuCollapsibleTrigger>
            <SidebarMenuCollapsibleContent ref={ref} keepMounted className="custom-panel">
              <a href="/project">Project</a>
            </SidebarMenuCollapsibleContent>
          </SidebarMenuCollapsible>
        </SidebarMenu>
      </SidebarProvider>
    );
    const { rerender } = render(view(true));
    const panel = ref.current!;
    const link = screen.getByRole("link", { name: "Project" });
    expect(panel).toHaveAttribute("data-slot", "sidebar-menu-collapsible-content");
    expect(panel).toHaveClass("custom-panel");
    expect(panel).toContainElement(link);
    rerender(view(false));
    expect(screen.getByRole("button", { name: "Projects" })).toHaveAttribute("aria-expanded", "false");
    rerender(view(true));
    await waitFor(() => expect(screen.getByRole("button", { name: "Projects" })).toHaveAttribute("aria-expanded", "true"));
    expect(ref.current).toBe(panel);
    expect(screen.getByRole("link", { name: "Project" })).toBe(link);
  });

  it("includes a trailing chevron and rotates it from the Base UI open state", async () => {
    const user = userEvent.setup();

    render(
      <SidebarProvider persist={false}>
        <SidebarMenu>
          <SidebarMenuCollapsible>
            <SidebarMenuCollapsibleTrigger>Projects</SidebarMenuCollapsibleTrigger>
            <SidebarMenuCollapsibleContent>Project list</SidebarMenuCollapsibleContent>
          </SidebarMenuCollapsible>
        </SidebarMenu>
      </SidebarProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Projects" });
    const chevron = trigger.querySelector('[data-slot="sidebar-menu-chevron"]');

    expect(chevron).toBeInTheDocument();
    expect(chevron).toHaveClass("-rotate-90");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Project list")).not.toBeInTheDocument();

    await user.click(trigger);

    await waitFor(() => expect(trigger).toHaveAttribute("data-panel-open"));
    expect(screen.getByText("Project list")).toBeInTheDocument();

    expect(trigger.lastElementChild).toBe(chevron);
  });

  it("allows a custom indicator to replace the default chevron", () => {
    render(
      <SidebarProvider persist={false}>
        <SidebarMenuCollapsible>
          <SidebarMenuCollapsibleTrigger chevron={false}>
            Projects
          </SidebarMenuCollapsibleTrigger>
          <SidebarMenuCollapsibleContent>Project list</SidebarMenuCollapsibleContent>
        </SidebarMenuCollapsible>
      </SidebarProvider>,
    );

    expect(document.querySelector('[data-slot="sidebar-menu-chevron"]')).not.toBeInTheDocument();
  });

  it("keeps a row action before the built-in chevron", () => {
    render(
      <SidebarProvider persist={false}>
        <SidebarMenu>
          <SidebarMenuCollapsible>
            <SidebarMenuCollapsibleTrigger>
              <span>Projects</span>
            </SidebarMenuCollapsibleTrigger>
            <SidebarMenuAction aria-label="More project actions" />
            <SidebarMenuCollapsibleContent>Project list</SidebarMenuCollapsibleContent>
          </SidebarMenuCollapsible>
        </SidebarMenu>
      </SidebarProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Projects" });
    const action = screen.getByRole("button", { name: "More project actions" });
    const chevron = trigger.querySelector('[data-slot="sidebar-menu-chevron"]');

    expect(trigger.lastElementChild).toBe(chevron);
    expect(trigger).toHaveClass(
      "group-has-[>_[data-slot=sidebar-menu-action]:hover]/menu-item:bg-muted",
    );
    expect(trigger).not.toHaveClass(
      "group-has-data-[slot=sidebar-menu-action]/menu-item:group-hover/menu-item:bg-muted",
    );
    expect(trigger).toHaveClass(
      "group-has-data-[slot=sidebar-menu-action]/menu-collapsible:pr-2!",
    );
    expect(action).toHaveClass(
      "group-has-data-[slot=sidebar-menu-chevron]/menu-collapsible:right-8",
    );
  });

  it("reserves badge and action slots before the built-in chevron", () => {
    render(
      <SidebarProvider persist={false}>
        <SidebarMenu>
          <SidebarMenuCollapsible>
            <SidebarMenuCollapsibleTrigger>
              <span>RSS</span>
            </SidebarMenuCollapsibleTrigger>
            <SidebarMenuBadge>7</SidebarMenuBadge>
            <SidebarMenuAction aria-label="Add RSS source" />
            <SidebarMenuCollapsibleContent>RSS sources</SidebarMenuCollapsibleContent>
          </SidebarMenuCollapsible>
        </SidebarMenu>
      </SidebarProvider>,
    );

    const trigger = screen.getByRole("button", { name: "RSS" });
    const badge = screen.getByText("7");
    const badgeSpacer = trigger.querySelector('[data-slot="sidebar-menu-badge-spacer"]');
    const actionSpacer = trigger.querySelector('[data-slot="sidebar-menu-action-spacer"]');
    const chevron = trigger.querySelector('[data-slot="sidebar-menu-chevron"]');

    expect(badgeSpacer).toBeInTheDocument();
    expect(actionSpacer).toBeInTheDocument();
    expect(
      Array.from(trigger.children)
        .slice(-3)
        .map((element) => element.getAttribute("data-slot")),
    ).toEqual([
      "sidebar-menu-badge-spacer",
      "sidebar-menu-action-spacer",
      "sidebar-menu-chevron",
    ]);
    expect(trigger.lastElementChild).toBe(chevron);
    expect(badge).toHaveClass(
      "group-has-data-[slot=sidebar-menu-chevron]/menu-collapsible:right-8",
    );
    expect(badge).toHaveClass(
      "group-has-data-[slot=sidebar-menu-action]/menu-collapsible:right-14!",
    );
  });

  it.each(["icon", "offcanvas"] as const)("steps a badge out for the length of a collapse (collapsible=%s)", (collapsible) => {
    vi.useFakeTimers();
    try {
      document.documentElement.style.setProperty("--duration-slow", "300ms");
      document.documentElement.style.setProperty("--duration-fast", "150ms");
      const tree = (open: boolean) => (
        <SidebarProvider open={open} persist={false}>
          <Sidebar collapsible={collapsible}>
            <SidebarMenu><SidebarMenuItem>
              <SidebarMenuButton>Inbox</SidebarMenuButton>
              <SidebarMenuBadge count={4} label="unread" />
            </SidebarMenuItem></SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      );
      const { container, rerender } = render(tree(true));
      const badge = container.ownerDocument.querySelector('[data-slot="sidebar-menu-badge"]')!;
      // Not on mount: a badge shown from the start never waits.
      expect(badge).not.toHaveAttribute("data-settling");

      for (const open of [false, true]) {
        rerender(tree(open));
        if (collapsible === "offcanvas") {
          // An offcanvas sidebar slides away whole; the badge goes with it.
          expect(badge).not.toHaveAttribute("data-settling");
          continue;
        }
        expect(badge).toHaveAttribute("data-settling");
        if (open) {
          // Expanding: the count is back in the first frame, with the row's action, and
          // fades in from the next one.
          expect(badge).not.toHaveAttribute("data-hold");
          act(() => vi.advanceTimersByTime(40));
          expect(badge).not.toHaveAttribute("data-settling");
          continue;
        }
        // Collapsing: the count is held while it fades out over the first half; at the
        // midpoint it becomes the dot, which fades in over the second.
        expect(badge).toHaveAttribute("data-hold", "count");
        act(() => vi.advanceTimersByTime(149));
        expect(badge).toHaveAttribute("data-hold");
        act(() => vi.advanceTimersByTime(1));
        expect(badge).not.toHaveAttribute("data-hold");
        expect(badge).not.toHaveAttribute("data-settling");
      }
    } finally {
      document.documentElement.style.removeProperty("--duration-slow");
      document.documentElement.style.removeProperty("--duration-fast");
      vi.useRealTimers();
    }
  });

  it("keeps a row with a tooltip mounted through a collapse, so its transitions can run", () => {
    const tree = (open: boolean) => (
      <SidebarProvider open={open} persist={false}>
        <Sidebar collapsible="icon">
          <SidebarMenu><SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings" size="sm"><span>Settings</span></SidebarMenuButton>
          </SidebarMenuItem></SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
    const { container, rerender } = render(tree(true));
    const row = container.ownerDocument.querySelector('[data-slot="sidebar-menu-button"]');
    rerender(tree(false));
    expect(container.ownerDocument.querySelector('[data-slot="sidebar-menu-button"]')).toBe(row);
    rerender(tree(true));
    expect(container.ownerDocument.querySelector('[data-slot="sidebar-menu-button"]')).toBe(row);
  });

  it("reports whether the sidebar it toggles is open", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SidebarProvider persist={false}>
        <SidebarTrigger />
        <Sidebar>Panel</Sidebar>
      </SidebarProvider>,
    );
    const trigger = container.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!;

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("SidebarTabs", () => {
  function Tabbed({ open = true }: { open?: boolean }) {
    return (
      <SidebarProvider open={open} persist={false}>
        <Sidebar collapsible="icon">
          <SidebarTabs defaultValue="workspace">
            <SidebarHeader>
              <span>Acme</span>
              <SidebarTabsList aria-label="Sections">
                <SidebarTabsTab value="workspace">Workspace</SidebarTabsTab>
                <SidebarTabsTab value="personal">Personal</SidebarTabsTab>
              </SidebarTabsList>
            </SidebarHeader>
            <SidebarTabsPanel value="workspace"><a href="/projects">Projects</a></SidebarTabsPanel>
            <SidebarTabsPanel value="personal"><a href="/drafts">Drafts</a></SidebarTabsPanel>
          </SidebarTabs>
        </Sidebar>
      </SidebarProvider>
    );
  }

  it("switches the panels and keeps the inactive one mounted", async () => {
    const user = userEvent.setup();
    render(<Tabbed />);
    expect(screen.getByRole("tab", { name: "Workspace" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("link", { name: "Projects" })).toBeVisible();
    expect(screen.getByText("Drafts").closest('[data-slot="sidebar-tabs-panel"]')).toHaveAttribute("hidden");

    await user.click(screen.getByRole("tab", { name: "Personal" }));
    expect(screen.getByRole("link", { name: "Drafts" })).toBeVisible();
    expect(screen.getByText("Projects").closest('[data-slot="sidebar-tabs-panel"]')).toHaveAttribute("hidden");
  });

  it("spans the row evenly and hides it in the icon rail", () => {
    render(<Tabbed />);
    const list = screen.getByRole("tablist", { name: "Sections" });
    expect(list).toHaveClass("w-full", "border");
    // Folds with the collapse rather than vanishing in its first frame.
    const fold = list.closest('[data-slot="sidebar-tabs-list-container"]');
    expect(fold).toHaveClass("group-data-[collapsible=icon]:grid-rows-[0fr]", "group-data-[collapsible=icon]:invisible");
    expect(screen.getByRole("tab", { name: "Personal" })).toHaveClass("flex-1", "text-xs");
  });
});
