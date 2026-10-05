import { fireEvent, render, screen } from "@testing-library/react";
import { createPortal } from "react-dom";
import { Button } from "@/registry/ui/button/button";
import { ActionButton } from "@/registry/ui/action-button/action-button";
import { ActionToggle } from "@/registry/ui/action-toggle/action-toggle";
import { Alert } from "@/registry/ui/alert/alert";
import { Badge } from "@/registry/ui/badge/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuActionItem } from "@/registry/ui/dropdown-menu/dropdown-menu";
import { CommandPalette, CommandPanelLoading } from "@/registry/ui/command-palette/command-palette";
import { ToastProvider, useToast } from "@/registry/ui/toast/toast";
import { LoaderProvider, LoadingIndicator } from "./loader";

const pending = () => new Promise<void>(() => {});

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
  expect(document.querySelector('[data-slot="loader"]')).toHaveTextContent("⠋");
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

it("passes palette defaults into a custom panel", () => {
  render(<CommandPalette open loader={<span>Palette</span>} initialItemId="panel" groups={[{
    items: [{ id: "panel", label: "Panel", panel: () => <CommandPanelLoading /> }],
  }]} />);
  expect(screen.getByText("Palette")).toBeInTheDocument();
});

it("preserves supplied toast nodes in promise options and updates", async () => {
  function Harness() {
    const toast = useToast();
    return <button onClick={() => {
      const id = toast.add({ type: "loading", title: "Global toast" });
      toast.update(id, { loader: <span>Updated</span> });
      void toast.promise(pending(), { loading: { title: "Promise toast", loader: <span>Promise</span> }, success: "Done", error: "Failed" });
    }}>Show</button>;
  }
  render(<ToastProvider loader={<span>Provider</span>}><Harness /></ToastProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Show" }));
  expect(await screen.findByText("Updated")).toBeInTheDocument();
  expect(await screen.findByText("Promise")).toBeInTheDocument();
});
