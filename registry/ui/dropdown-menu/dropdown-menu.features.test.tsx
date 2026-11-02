import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuPortal, DropdownMenuPositioner, DropdownMenuPopup, createDropdownMenuHandle,
  DropdownMenuSelect, DropdownMenuSelectTrigger, DropdownMenuSelectContent, DropdownMenuSelectItem,
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
  expect(popup).toHaveClass("open-panel", "bg-surface");
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
