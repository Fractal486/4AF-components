import { fireEvent, render, screen } from "@testing-library/react";
import { createPortal } from "react-dom";
import { Button } from "@/registry/ui/button/button";
import { ActionButton } from "@/registry/ui/action-button/action-button";
import { ActionToggle } from "@/registry/ui/action-toggle/action-toggle";
import { Alert } from "@/registry/ui/alert/alert";
import { Badge } from "@/registry/ui/badge/badge";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";
import { Morph } from "@/registry/ui/morph/morph";
import { DropdownMenu, DropdownMenuContent, DropdownMenuActionItem } from "@/registry/ui/dropdown-menu/dropdown-menu";
import { CommandPalette, CommandPanelLoading } from "@/registry/ui/command-palette/command-palette";
import { LoaderProvider, LoadingIndicator } from "./loader";

const pending = () => new Promise<void>(() => {});

it.each(["badge", "button", "button-icon", "toggle"])("mounts a supplied loader only for the visible pending %s", (kind) => {
  const control = (loading: boolean) => kind === "badge"
    ? <Badge status={loading ? "loading" : "neutral"}>Status</Badge>
    : kind.startsWith("button")
      ? <ActionButton action={pending} pendingMode={kind === "button-icon" ? "icon" : "label"}>Run</ActionButton>
      : <ActionToggle action={pending}>Run</ActionToggle>;
  const loader = <AsciiLoader className="test-loader" />;
  const { container, rerender } = render(<LoaderProvider loader={loader}>{control(false)}</LoaderProvider>);
  expect(container.querySelectorAll(".test-loader")).toHaveLength(0);
  // The hidden copy keeps the control's indicator footprint without mounting its animation.
  const sizer = container.querySelector('[aria-hidden="true"] [data-slot="loader"]');
  expect(sizer).toHaveClass(kind === "badge" ? "size-2.5" : "size-[1em]");
  expect(sizer).toBeEmptyDOMElement();
  if (kind === "badge") rerender(<LoaderProvider loader={loader}>{control(true)}</LoaderProvider>);
  else fireEvent.click(screen.getByRole("button", { name: "Run" }));
  expect(container.querySelectorAll(".test-loader")).toHaveLength(1);
});

it.each(["widest", "current"] as const)("suppresses local and fallback loaders in %s sizers, including nested Morphs", (sizing) => {
  const { container } = render(<Morph<"idle" | "pending"> sizing={sizing} activeKey="idle" items={{
    idle: "Ready",
    pending: <Morph<"pending" | "other"> activeKey="pending" items={{
      pending: <LoadingIndicator loader={<AsciiLoader className="local-loader" />} />,
      other: <LoadingIndicator />,
    }} />,
  }} />);
  expect(container.querySelector(".local-loader")).toBeNull();
  expect(container.querySelector('[data-slot="classic-loader"]')).toBeNull();
  expect(container.querySelectorAll('[data-slot="loader"]').length).toBeGreaterThan(0);
});

it("inherits supplied nodes through nested providers and portals, with local overrides", () => {
  const { rerender } = render(<LoaderProvider loader={<span>Global</span>}>
    <LoaderProvider>{createPortal(<LoadingIndicator />, document.body)}</LoaderProvider>
    <LoadingIndicator loader={<span>Local</span>} />
    <LoadingIndicator loader={null} />
  </LoaderProvider>);
  expect(screen.getByText("Global").parentElement).toHaveAttribute("aria-hidden", "true");
  expect(screen.getByText("Local")).toBeInTheDocument();
  expect(document.querySelectorAll('[data-slot="loader"]')).toHaveLength(3);
  rerender(<LoaderProvider loader={<span>Changed</span>}>{createPortal(<LoadingIndicator />, document.body)}</LoaderProvider>);
  expect(screen.getByText("Changed")).toBeInTheDocument();
  rerender(<LoadingIndicator />);
  expect(document.querySelector('[data-slot="loader"] [data-slot="classic-loader"]')).toBeInTheDocument();
});

it("supplies button, action, toggle, alert and badge loaders without replacing custom icons", () => {
  render(<LoaderProvider loader={<span>Global</span>}>
    <Button loading data-testid="button">Save</Button>
    <Button loading loader={<span>Local</span>}>Save locally</Button>
    <ActionButton action={pending} data-testid="action">Run</ActionButton>
    <ActionToggle action={pending} data-testid="toggle">Follow</ActionToggle>
    <Alert variant="loading" data-testid="alert">Checking</Alert>
    <Badge status="loading" data-testid="badge">Syncing</Badge>
    <Badge status="loading" icon={<span>Custom</span>} data-testid="custom">Custom badge</Badge>
  </LoaderProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Run" }));
  fireEvent.click(screen.getByRole("button", { name: "Follow" }));
  for (const id of ["button", "action", "toggle", "alert", "badge"]) {
    expect(screen.getByTestId(id)).toHaveTextContent("Global");
  }
  expect(screen.getByText("Local")).toBeInTheDocument();
  expect(screen.getByTestId("custom")).toHaveTextContent("Custom");
  expect(screen.getByTestId("custom")).not.toHaveTextContent("Global");
});

it("keeps menu root and row overrides in the portal", () => {
  render(<LoaderProvider loader={<span>Outer</span>}>
    <DropdownMenu defaultOpen loader={<span>Menu</span>}><DropdownMenuContent>
      <DropdownMenuActionItem action={pending}>Run</DropdownMenuActionItem>
      <DropdownMenuActionItem action={pending} loader={<span>Row</span>}>Local</DropdownMenuActionItem>
    </DropdownMenuContent></DropdownMenu>
  </LoaderProvider>);
  const run = screen.getByRole("menuitem", { name: "Run" });
  const local = screen.getByRole("menuitem", { name: "Local" });
  fireEvent.click(run);
  fireEvent.click(local);
  expect(run).toHaveTextContent("Menu");
  expect(local).toHaveTextContent("Row");
  expect(screen.queryByText("Outer")).toBeNull();
});

it("gives a menu row's loader the row's 14px glyph box", () => {
  render(<DropdownMenu defaultOpen><DropdownMenuContent>
    <DropdownMenuActionItem action={pending}>Run</DropdownMenuActionItem>
  </DropdownMenuContent></DropdownMenu>);
  const run = screen.getByRole("menuitem", { name: "Run" });
  fireEvent.click(run);
  expect(run).toHaveClass("[&_svg]:size-3.5", "[&_[data-slot=loader]]:size-3.5");
  expect(run.querySelector('[data-slot="loader"]')).toBeInTheDocument();
});

it("sizes the palette's standalone loader like its 16px icons", () => {
  render(<CommandPalette open initialItemId="panel" groups={[{
    items: [{ id: "panel", label: "Panel", panel: () => <CommandPanelLoading /> }],
  }]} />);
  expect(document.querySelector('[data-slot="loader"]')).toHaveClass("size-4");
});

it("passes palette defaults into a custom panel", () => {
  render(<CommandPalette open loader={<span>Palette</span>} initialItemId="panel" groups={[{
    items: [{ id: "panel", label: "Panel", panel: () => <CommandPanelLoading /> }],
  }]} />);
  expect(screen.getByText("Palette")).toBeInTheDocument();
});
