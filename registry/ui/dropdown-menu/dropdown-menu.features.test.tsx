import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuPortal, DropdownMenuPositioner, DropdownMenuPopup, createDropdownMenuHandle,
  DropdownMenuSelect, DropdownMenuSelectTrigger, DropdownMenuSelectContent, DropdownMenuSelectItem,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "./dropdown-menu";

it("shares a menu between detached typed triggers and restores focus to the opening trigger", async () => {
  const user = userEvent.setup();
  function Shared() {
    const [handle] = useState(() => createDropdownMenuHandle<{ name: string }>());
    return <>
      <DropdownMenuTrigger handle={handle} payload={{ name: "Alex" }}>Alex</DropdownMenuTrigger>
      <DropdownMenuTrigger handle={handle} payload={{ name: "Taylor" }}>Taylor</DropdownMenuTrigger>
      <DropdownMenu handle={handle}>{({ payload }) => <DropdownMenuContent>
        <DropdownMenuItem>Edit {payload?.name}</DropdownMenuItem>
      </DropdownMenuContent>}</DropdownMenu>
    </>;
  }
  render(<Shared />);
  for (const name of ["Alex", "Taylor"]) {
    const trigger = screen.getByRole("button", { name });
    await user.click(trigger);
    expect(await screen.findByRole("menuitem", { name: `Edit ${name}` })).toBeVisible();
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  }
});

it("preserves portal, positioner, and popup refs, DOM props, rendering, and state classes", async () => {
  const popupRef = createRef<HTMLDivElement>();
  const positionerRef = createRef<HTMLDivElement>();
  const portalRef = createRef<HTMLDivElement>();
  const tree = (open: boolean) => <DropdownMenu open={open}>
    <DropdownMenuTrigger>Open</DropdownMenuTrigger>
    <DropdownMenuContent ref={popupRef} render={<section data-custom="popup" />}
      className={state => state.open ? "open-panel" : "closed-panel"}
      portalProps={{ ref: portalRef, keepMounted: true }}
      positionerProps={{ ref: positionerRef, positionMethod: "fixed", sticky: true,
        collisionPadding: 12, collisionAvoidance: { side: "none", align: "none" },
        className: state => state.open ? "open-positioner" : "closed-positioner" }}>
      <DropdownMenuItem>Command</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
  const { rerender } = render(tree(true));
  const popup = await screen.findByRole("menu");
  expect(popupRef.current).toBe(popup);
  expect(popup.tagName).toBe("SECTION");
  expect(popup).toHaveAttribute("data-custom", "popup");
  expect(popup).toHaveClass("open-panel", "material-glass");
  expect(positionerRef.current).toHaveClass("open-positioner", "z-50");
  expect(positionerRef.current).toHaveStyle({ position: "fixed" });
  expect(portalRef.current).toContainElement(popup);
  rerender(tree(false));
  await waitFor(() => expect(popup).toHaveClass("closed-panel"));
  expect(positionerRef.current).toHaveClass("closed-positioner");
  expect(popupRef.current).toBe(popup);
});

it("uses a custom portal container and keeps local row state through closing", async () => {
  const user = userEvent.setup();
  const container = document.createElement("div");
  document.body.appendChild(container);
  try {
    render(<DropdownMenu><DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent portalProps={{ container, keepMounted: true }}>
        <DropdownMenuCheckboxItem>Show details</DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>);
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    const row = await screen.findByRole("menuitemcheckbox");
    expect(container).toContainElement(row);
    await user.click(row);
    expect(row).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(row).toBeInTheDocument();
    await user.click(trigger);
    expect(await screen.findByRole("menuitemcheckbox")).toBe(row);
    expect(row).toHaveAttribute("aria-checked", "true");
  } finally { container.remove(); }
});

it("lets the existing keepMounted shorthand override portalProps", async () => {
  const user = userEvent.setup();
  render(<DropdownMenu><DropdownMenuTrigger>Open</DropdownMenuTrigger>
    <DropdownMenuContent keepMounted={false} portalProps={{ keepMounted: true }}>
      <DropdownMenuItem>Command</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>);
  await user.click(screen.getByRole("button", { name: "Open" }));
  const popup = await screen.findByRole("menu");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(popup).not.toBeInTheDocument());
});

it("updates row callback classes for keyboard highlight, disabled state, and checked state", async () => {
  const user = userEvent.setup();
  render(<DropdownMenu><DropdownMenuTrigger>Open</DropdownMenuTrigger><DropdownMenuContent>
    <DropdownMenuItem className={state => state.highlighted ? "active-row" : "resting-row"}>Command</DropdownMenuItem>
    <DropdownMenuItem disabled className={state => state.disabled ? "unavailable" : "available"}>Disabled</DropdownMenuItem>
    <DropdownMenuCheckboxItem className={state => state.checked ? "checked-row" : "unchecked-row"}>Details</DropdownMenuCheckboxItem>
    <DropdownMenuRadioGroup defaultValue="a">
      <DropdownMenuRadioItem value="a" closeOnClick={false} className={state => state.checked ? "chosen" : "unchosen"}>A</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="b" closeOnClick={false} className={state => state.checked ? "chosen" : "unchosen"}>B</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent></DropdownMenu>);
  screen.getByRole("button", { name: "Open" }).focus();
  await user.keyboard("{ArrowDown}");
  await waitFor(() => expect(screen.getByRole("menuitem", { name: "Command" })).toHaveClass("active-row"));
  expect(screen.getByRole("menuitem", { name: "Disabled" })).toHaveClass("unavailable", "relative");
  const checkbox = screen.getByRole("menuitemcheckbox");
  expect(checkbox).toHaveClass("unchecked-row");
  checkbox.focus();
  await user.keyboard(" ");
  expect(checkbox).toHaveClass("checked-row", "relative");
  await user.click(screen.getByRole("menuitemradio", { name: "B" }));
  expect(screen.getByRole("menuitemradio", { name: "B" })).toHaveClass("chosen");
  expect(screen.getByRole("menuitemradio", { name: "A" })).toHaveClass("unchosen");
});

it.each([false, true])("preserves state callbacks and portal mounting options in nested select (multiple=%s)", async multiple => {
  const user = userEvent.setup();
  render(<DropdownMenu><DropdownMenuTrigger>Open</DropdownMenuTrigger><DropdownMenuContent>
    <DropdownMenuSelect multiple={multiple} defaultValue={multiple ? ["a"] : "a"}>
      <DropdownMenuSelectTrigger placeholder="Choose" className={state => state.open ? "select-open" : "select-closed"} />
      <DropdownMenuSelectContent portalProps={{ keepMounted: false }} className={state => state.open ? "panel-open" : "panel-closed"}>
        <DropdownMenuSelectItem value="a" className={state => state.checked ? "chosen" : "unchosen"}>Alpha</DropdownMenuSelectItem>
        <DropdownMenuSelectItem value="b" className={state => state.checked ? "chosen" : "unchosen"}>Beta</DropdownMenuSelectItem>
      </DropdownMenuSelectContent>
    </DropdownMenuSelect>
  </DropdownMenuContent></DropdownMenu>);
  await user.click(screen.getByRole("button", { name: "Open" }));
  const trigger = await screen.findByRole("menuitem", { name: /Choose/ });
  await user.hover(trigger);
  const row = await screen.findByRole(multiple ? "menuitemcheckbox" : "menuitemradio", { name: "Alpha" });
  expect(row).toHaveClass("chosen");
  // Both modes mark the selection with a trailing check, never a checkbox.
  expect(row.lastElementChild).toHaveAttribute("data-checked");
  expect(row.querySelector("[role=checkbox]")).toBeNull();
  expect(trigger).toHaveClass("select-open");
  expect(row.closest('[role="menu"]')).toHaveClass("panel-open");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(row).not.toBeInTheDocument());
});

it("supports composing the public portal, positioner, and popup parts", async () => {
  const user = userEvent.setup();
  render(<DropdownMenu><DropdownMenuTrigger>Open</DropdownMenuTrigger>
    <DropdownMenuPortal><DropdownMenuPositioner side="top" sideOffset={() => 12}>
      <DropdownMenuPopup><DropdownMenuItem>Command</DropdownMenuItem></DropdownMenuPopup>
    </DropdownMenuPositioner></DropdownMenuPortal>
  </DropdownMenu>);
  await user.click(screen.getByRole("button", { name: "Open" }));
  expect(await screen.findByRole("menu")).toContainElement(screen.getByRole("menuitem"));
  await user.click(screen.getByRole("menuitem"));
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
});

it.each([false, true])("lets a nested select's row go dormant when the pointer leaves, unless searchable (searchable=%s)", async (searchable) => {
  // The submenu's positioner is pointer-transparent while it opens; the rows themselves are not.
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  render(<DropdownMenu><DropdownMenuTrigger>Open</DropdownMenuTrigger><DropdownMenuContent>
    <DropdownMenuSelect defaultValue="a">
      <DropdownMenuSelectTrigger placeholder="Choose" />
      <DropdownMenuSelectContent searchable={searchable}>
        <DropdownMenuSelectItem value="a">Alpha</DropdownMenuSelectItem>
        <DropdownMenuSelectItem value="b">Beta</DropdownMenuSelectItem>
        <DropdownMenuSelectItem value="c">Gamma</DropdownMenuSelectItem>
      </DropdownMenuSelectContent>
    </DropdownMenuSelect>
  </DropdownMenuContent></DropdownMenu>);
  await user.click(screen.getByRole("button", { name: "Open" }));
  const trigger = await screen.findByRole("menuitem", { name: /Choose/ });
  await user.hover(trigger);
  const beta = await screen.findByRole("menuitemradio", { name: "Beta" });
  // The panel opens on its selected row a frame later; let that land first.
  await waitFor(() => expect(screen.getByRole("menuitemradio", { name: "Alpha" })).toHaveAttribute("data-panel-active"));
  await user.hover(beta);
  // Rows activate on focus; jsdom moves no focus on hover, so give it directly.
  act(() => beta.focus());
  await waitFor(() => expect(beta).toHaveAttribute("data-panel-active"));

  // The pointer leaves the panel. (Moving it onto the parent row in jsdom closes and reopens
  // the submenu, which resets it to the selected row; a browser keeps it open.)
  fireEvent.pointerOut(beta, { relatedTarget: document.body });
  expect(beta).toHaveAttribute("data-panel-active");
  if (searchable) {
    expect(beta).not.toHaveAttribute("data-panel-dormant");
    return;
  }
  await waitFor(() => expect(beta).toHaveAttribute("data-panel-dormant"));
  // Base UI parks focus on the panel itself once the pointer has left; resume from there.
  const panel = beta.closest<HTMLElement>('[role="menu"]')!;
  act(() => panel.focus());
  await user.keyboard("{ArrowDown}");
  // `hidden: true` because jsdom's zero-size anchor gets the positioner marked hidden.
  const gamma = screen.getByRole("menuitemradio", { name: "Gamma", hidden: true });
  await waitFor(() => expect(gamma).toHaveFocus());
  expect(gamma).not.toHaveAttribute("data-panel-dormant");
});

it("swaps sibling submenus with a short animation, and an ordinary open with the full one", async () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  render(<DropdownMenu><DropdownMenuTrigger>Open</DropdownMenuTrigger><DropdownMenuContent>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
      <DropdownMenuSubContent><DropdownMenuItem>Email</DropdownMenuItem></DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
      <DropdownMenuSubContent><DropdownMenuItem>PDF</DropdownMenuItem></DropdownMenuSubContent>
    </DropdownMenuSub>
  </DropdownMenuContent></DropdownMenu>);
  await user.click(screen.getByRole("button", { name: "Open" }));

  const share = await screen.findByRole("menuitem", { name: "Share" });
  await user.hover(share);
  await waitFor(() => expect(share).toHaveAttribute("aria-expanded", "true"));
  const sharePanel = screen.getByText("Email").closest<HTMLElement>('[data-slot="dropdown-menu-sub-content"]')!;
  expect(sharePanel).not.toHaveAttribute("data-swap");

  const exportRow = screen.getByRole("menuitem", { name: "Export" });
  await user.hover(exportRow);
  await waitFor(() => expect(exportRow).toHaveAttribute("aria-expanded", "true"));
  const exportPanel = screen.getByText("PDF").closest<HTMLElement>('[data-slot="dropdown-menu-sub-content"]')!;
  expect(exportPanel).toHaveAttribute("data-swap");
  expect(exportPanel.className).toContain("data-swap:duration-(--duration-fast)");
});
