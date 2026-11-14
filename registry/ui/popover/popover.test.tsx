import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import {
  Popover, PopoverTrigger, PopoverClose, PopoverContent, PopoverHeader, PopoverTitle,
  PopoverDescription, PopoverPortal, PopoverPositioner, PopoverPopup, createPopoverHandle,
} from "./popover";

it("preserves state classes, custom rendering, DOM props, and refs", async () => {
  const user = userEvent.setup();
  const popupRef = createRef<HTMLDivElement>();
  const positionerRef = createRef<HTMLDivElement>();
  const portalRef = createRef<HTMLDivElement>();
  const headerRef = createRef<HTMLDivElement>();
  const titleClass = vi.fn(() => "custom-title");
  const descriptionClass = vi.fn(() => "custom-description");
  render(<Popover>
    <PopoverTrigger>Open</PopoverTrigger>
    <PopoverContent ref={popupRef} render={<section data-custom="panel" />}
      className={state => state.open ? "is-open" : "is-closed"}
      contentClassName="space-y-3" portalProps={{ keepMounted: true, ref: portalRef }}
      positionerProps={{ ref: positionerRef, className: state => state.open ? "positioned" : "resting" }}>
      <PopoverHeader ref={headerRef}>
        <PopoverTitle className={titleClass}>Settings</PopoverTitle>
        <PopoverDescription className={descriptionClass}>Details</PopoverDescription>
      </PopoverHeader>
      <PopoverClose>Done</PopoverClose>
    </PopoverContent>
  </Popover>);
  await user.click(screen.getByRole("button", {name:"Open"}));
  const popup = await screen.findByRole("dialog", {name:"Settings"});
  expect(popupRef.current).toBe(popup);
  expect(popup.tagName).toBe("SECTION");
  expect(popup).toHaveAttribute("data-custom", "panel");
  expect(popup).toHaveClass("is-open", "material-glass");
  expect(positionerRef.current).toHaveClass("positioned", "z-50");
  expect(portalRef.current).toContainElement(popup);
  expect(headerRef.current).toContainElement(screen.getByRole("heading"));
  expect(screen.getByRole("heading")).toHaveClass("custom-title", "wrap-anywhere");
  expect(screen.getByText("Details")).toHaveClass("custom-description");
  expect(titleClass).toHaveBeenCalledWith(expect.any(Object));
  expect(descriptionClass).toHaveBeenCalledWith(expect.any(Object));
  expect(popup.querySelector('[data-slot="popover-content-sizer"]')).toHaveClass("space-y-3");
  await user.click(screen.getByRole("button", {name:"Done"}));
  await waitFor(() => expect(popup).toHaveClass("is-closed"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", {name:"Open"})).toHaveFocus();
});

it("mounts in a chosen container and preserves input state while closed", async () => {
  const user = userEvent.setup();
  const container = document.createElement("div");
  document.body.appendChild(container);
  try {
    render(<Popover><PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent aria-label="Edit" portalProps={{container, keepMounted:true}}>
        <input aria-label="Name" defaultValue="Alex" /><PopoverClose>Done</PopoverClose>
      </PopoverContent>
    </Popover>);
    await user.click(screen.getByRole("button", {name:"Open"}));
    const input = await screen.findByRole("textbox");
    expect(container).toContainElement(input);
    await user.clear(input); await user.type(input,"Taylor");
    await user.click(screen.getByRole("button", {name:"Done"}));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(input).toBeInTheDocument();
    await user.click(screen.getByRole("button", {name:"Open"}));
    expect(await screen.findByRole("textbox")).toBe(input);
    expect(input).toHaveValue("Taylor");
  } finally { container.remove(); }
});

it("shares a popup between detached typed triggers and returns focus to the active one", async () => {
  const user = userEvent.setup();
  function Shared() {
    const [handle] = useState(() => createPopoverHandle<{name:string}>());
    return <>
      <PopoverTrigger handle={handle} payload={{name:"Alex"}}>Alex</PopoverTrigger>
      <PopoverTrigger handle={handle} payload={{name:"Taylor"}}>Taylor</PopoverTrigger>
      <Popover handle={handle}>{({payload}) => <PopoverContent>
        <PopoverTitle>Edit {payload?.name}</PopoverTitle><PopoverClose>Done</PopoverClose>
      </PopoverContent>}</Popover>
    </>;
  }
  render(<Shared />);
  for (const name of ["Alex", "Taylor"]) {
    const trigger = screen.getByRole("button", {name});
    await user.click(trigger);
    expect(await screen.findByRole("dialog", {name:`Edit ${name}`})).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  }
});

it("supports separately composed parts with custom focus targets", async () => {
  const user = userEvent.setup();
  const input = createRef<HTMLInputElement>();
  render(<Popover>
    <PopoverTrigger>Open</PopoverTrigger>
    <PopoverPortal><PopoverPositioner align="start"><PopoverPopup aria-label="Custom" initialFocus={input}>
      <button>First</button><input ref={input} aria-label="Target" /><PopoverClose>Close</PopoverClose>
    </PopoverPopup></PopoverPositioner></PopoverPortal>
  </Popover>);
  await user.click(screen.getByRole("button", {name:"Open"}));
  await waitFor(() => expect(input.current).toHaveFocus());
  expect(screen.getByRole("dialog")).toContainElement(screen.getByRole("textbox"));
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("keeps the parent open while interacting with a nested popup", async () => {
  const user = userEvent.setup();
  render(<Popover><PopoverTrigger>Parent</PopoverTrigger>
    <PopoverContent aria-label="Parent panel">
      <Popover><PopoverTrigger>Child</PopoverTrigger>
        <PopoverContent aria-label="Child panel"><input aria-label="Child value" /></PopoverContent>
      </Popover>
    </PopoverContent>
  </Popover>);
  await user.click(screen.getByRole("button", {name:"Parent"}));
  await user.click(await screen.findByRole("button", {name:"Child"}));
  const child = await screen.findByRole("dialog", {name:"Child panel"});
  await user.type(within(child).getByRole("textbox"),"hello");
  expect(screen.getByRole("dialog", {name:"Parent panel"})).toBeVisible();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog", {name:"Child panel"})).not.toBeInTheDocument());
  expect(screen.getByRole("dialog", {name:"Parent panel"})).toBeVisible();
  expect(screen.getByRole("button", {name:"Child"})).toHaveFocus();
});

it("preserves controlled, cancellable opening and close notifications", async () => {
  const user = userEvent.setup();
  const changes = vi.fn();
  const complete = vi.fn();
  function Controlled() {
    const [open,setOpen] = useState(false);
    return <Popover open={open} onOpenChange={(next,details) => {
      changes(next,details.reason);
      if(details.reason === "escape-key") details.cancel(); else setOpen(next);
    }} onOpenChangeComplete={complete}>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent aria-label="Controlled"><PopoverClose>Done</PopoverClose></PopoverContent>
    </Popover>;
  }
  render(<Controlled />);
  await user.click(screen.getByRole("button", {name:"Open"}));
  await screen.findByRole("dialog");
  await user.keyboard("{Escape}");
  expect(changes).toHaveBeenCalledWith(false,"escape-key");
  expect(screen.getByRole("dialog")).toBeVisible();
  await user.click(screen.getByRole("button", {name:"Done"}));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(complete).toHaveBeenCalledWith(false);
});

it("can opt out of automatic sizing without remounting content", async () => {
  const ref = createRef<HTMLDivElement>();
  const tree = (autoSize:boolean) => <Popover defaultOpen>
    <PopoverTrigger>Open</PopoverTrigger>
    <PopoverContent ref={ref} aria-label="Fixed" autoSize={autoSize} style={{height:240}}>
      <input aria-label="Value" defaultValue="Kept" />
    </PopoverContent>
  </Popover>;
  const {rerender} = render(tree(true));
  const input = await screen.findByRole("textbox");
  rerender(tree(false));
  expect(ref.current).not.toHaveAttribute("data-auto-size");
  expect(ref.current).toHaveStyle({height:"240px"});
  expect(screen.getByRole("textbox")).toBe(input);
});

it("opens on hover and respects disabled triggers", async () => {
  const user = userEvent.setup();
  render(<><Popover><PopoverTrigger openOnHover delay={0} closeDelay={0}>Hover</PopoverTrigger>
    <PopoverContent aria-label="Preview">Preview content</PopoverContent>
  </Popover><Popover><PopoverTrigger disabled>Disabled</PopoverTrigger>
    <PopoverContent aria-label="Unavailable">Disabled content</PopoverContent>
  </Popover></>);
  await user.hover(screen.getByRole("button", {name:"Hover"}));
  expect(await screen.findByRole("dialog", {name:"Preview"})).toBeVisible();
  await user.unhover(screen.getByRole("button", {name:"Hover"}));
  await waitFor(() => expect(screen.queryByRole("dialog", {name:"Preview"})).not.toBeInTheDocument());
  await user.click(screen.getByRole("button", {name:"Disabled"}));
  expect(screen.queryByRole("dialog", {name:"Unavailable"})).not.toBeInTheDocument();
});
