import { createRef } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Sidebar, SidebarMenuBadge, SidebarProvider, SidebarTrigger, useSidebar,
} from "./sidebar";

describe("Sidebar shortcut ownership", () => {
  it("targets the focused sidebar and otherwise the first in page order", () => {
    const first = vi.fn(), second = vi.fn();
    render(<>
      <SidebarProvider persist={false} onOpenChange={first}><button>First scope</button></SidebarProvider>
      <SidebarProvider persist={false} onOpenChange={second}><button>Second scope</button></SidebarProvider>
    </>);
    screen.getByText("Second scope").focus();
    fireEvent.keyDown(document.activeElement!, { key: "b", ctrlKey: true });
    expect(second).toHaveBeenLastCalledWith(false);
    expect(first).not.toHaveBeenCalled();
    (document.activeElement as HTMLElement).blur();
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("gives a nested provider ownership without toggling its parent", () => {
    const parent = vi.fn(), nested = vi.fn();
    render(<SidebarProvider persist={false} onOpenChange={parent}>
      <SidebarProvider persist={false} onOpenChange={nested}><button>Nested scope</button></SidebarProvider>
    </SidebarProvider>);
    screen.getByText("Nested scope").focus();
    fireEvent.keyDown(document.activeElement!, { key: "b", ctrlKey: true });
    expect(nested).toHaveBeenCalledOnce();
    expect(parent).not.toHaveBeenCalled();
  });

  it("supports custom combinations, exact modifiers, disabling, cleanup, and forwarded refs", () => {
    const onOpenChange = vi.fn(), ref = createRef<HTMLDivElement>();
    const { rerender, unmount } = render(<SidebarProvider ref={ref} persist={false} keyboardShortcut="ctrl+shift+s" onOpenChange={onOpenChange} />);
    expect(ref.current).toHaveAttribute("data-slot", "sidebar-wrapper");
    for (const modifiers of [{ ctrlKey: true }, { ctrlKey: true, shiftKey: true, altKey: true }]) {
      fireEvent.keyDown(window, { key: "s", ...modifiers });
    }
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "S", ctrlKey: true, shiftKey: true });
    expect(onOpenChange).toHaveBeenCalledOnce();
    rerender(<SidebarProvider persist={false} keyboardShortcut={null} onOpenChange={onOpenChange} />);
    fireEvent.keyDown(window, { key: "S", ctrlKey: true, shiftKey: true });
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    unmount();
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledOnce();
  });

  it("uses Command for mod on Apple platforms", () => {
    const platform = vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel");
    const onOpenChange = vi.fn();
    render(<SidebarProvider persist={false} onOpenChange={onOpenChange} />);
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "b", metaKey: true });
    expect(onOpenChange).toHaveBeenCalledOnce();
    platform.mockRestore();
  });

  it("ignores editors, repeats, composition, and already-handled events", () => {
    const onOpenChange = vi.fn();
    render(<SidebarProvider persist={false} onOpenChange={onOpenChange}>
      <input aria-label="Search" /><textarea aria-label="Notes" />
      <div contentEditable suppressContentEditableWarning><span>Editor text</span></div>
      <button onKeyDown={event => event.preventDefault()}>Handled</button>
    </SidebarProvider>);
    for (const target of [screen.getByLabelText("Search"), screen.getByLabelText("Notes"), screen.getByText("Editor text"), screen.getByText("Handled")]) {
      fireEvent.keyDown(target, { key: "b", ctrlKey: true });
    }
    fireEvent.keyDown(window, { key: "b", ctrlKey: true, repeat: true });
    fireEvent.keyDown(window, { key: "b", ctrlKey: true, isComposing: true });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("updates the trigger hint with its shortcut", async () => {
    const user = userEvent.setup();
    render(<SidebarProvider persist={false} keyboardShortcut="ctrl+shift+s"><SidebarTrigger /></SidebarProvider>);
    await user.hover(screen.getByRole("button", { name: "Toggle sidebar" }));
    expect(await screen.findByText("Ctrl + Shift + S")).toBeVisible();
  });
});

function DrawerState({ name }: { name: string }) {
  const { openMobile } = useSidebar();
  return <output data-testid={name}>{openMobile ? "open" : "closed"}</output>;
}

describe("Sidebar mobile links", () => {
  beforeEach(() => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({
      ...original(query), matches: query === "(max-width: 767px)",
    }));
  });
  afterEach(() => vi.restoreAllMocks());

  it("keeps special clicks open, then closes a router-handled link", async () => {
    const user = userEvent.setup();
    render(<SidebarProvider persist={false}>
      <SidebarTrigger /><DrawerState name="drawer" />
      <Sidebar>
        <a href="#page" onClick={event => event.preventDefault()}><span>Page</span></a>
        <a href="#download" download>Download</a>
        <a href="#new-tab" target="_blank">New tab</a>
        <a href="#disabled" aria-disabled="true">Disabled</a>
        <button>Action</button>
      </Sidebar>
    </SidebarProvider>);
    await user.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    const dialog = await screen.findByRole("dialog");
    for (const name of ["Download", "New tab", "Disabled", "Action"]) {
      fireEvent.click(within(dialog).getByText(name));
      expect(screen.getByTestId("drawer")).toHaveTextContent("open");
    }
    for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      fireEvent.click(within(dialog).getByText("Page"), modifiers);
      expect(screen.getByTestId("drawer")).toHaveTextContent("open");
    }
    fireEvent.click(within(dialog).getByText("Page"));
    expect(screen.getByTestId("drawer")).toHaveTextContent("closed");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("scopes shortcuts to the focused portalled drawer", async () => {
    const user = userEvent.setup();
    render(<>
      <SidebarProvider persist={false}><SidebarTrigger aria-label="First toggle" /><Sidebar>First drawer</Sidebar><DrawerState name="first" /></SidebarProvider>
      <SidebarProvider persist={false}><SidebarTrigger aria-label="Second toggle" /><Sidebar><button>In second drawer</button></Sidebar><DrawerState name="second" /></SidebarProvider>
    </>);
    await user.click(screen.getByRole("button", { name: "Second toggle" }));
    const inside = await screen.findByRole("button", { name: "In second drawer" });
    inside.focus();
    fireEvent.keyDown(inside, { key: "b", ctrlKey: true });
    expect(screen.getByTestId("second")).toHaveTextContent("closed");
    expect(screen.getByTestId("first")).toHaveTextContent("closed");
  });
});

describe("Sidebar count and dot badges", () => {
  it("caps visible counts while exposing the full count and label", () => {
    const { container } = render(<SidebarMenuBadge count={125} max={99} label="unread messages" />);
    expect(screen.getByText("99+")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("125")).toHaveClass("sr-only");
    expect(screen.getByText("unread messages")).toHaveClass("sr-only");
    expect(container.querySelector('[data-slot="number-animation"]')).toBeNull();
  });

  it.each([0, -2, NaN, Infinity])("hides empty or invalid count %s", count => {
    const { container } = render(<SidebarMenuBadge count={count} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opts into Number Animation and preserves custom children", () => {
    const { container, rerender } = render(<SidebarMenuBadge count={12} animated />);
    expect(container.querySelector('[data-slot="number-animation"]')).toBeInTheDocument();
    rerender(<SidebarMenuBadge>New</SidebarMenuBadge>);
    expect(screen.getByText("New")).toHaveAttribute("data-slot", "sidebar-menu-badge");
  });

  it("names standalone dots and supports colored notification counts", () => {
    const { container } = render(<SidebarMenuBadge dot tone="success" label="Connected" />);
    expect(container.firstChild).toHaveAttribute("data-dot");
    expect(container.firstChild).toHaveAttribute("data-tone", "success");
    expect(screen.getByText("Connected")).toHaveClass("sr-only");
  });
});
