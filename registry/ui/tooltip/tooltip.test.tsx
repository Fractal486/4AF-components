import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState, type ComponentProps } from "react";
import {
  Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent,
  TooltipGroup, TooltipPortal, TooltipPositioner, TooltipPopup, createTooltipHandle,
} from "./tooltip";

function StatefulTrigger(props: ComponentProps<"button">) {
  const [count, setCount] = useState(0);
  return (
    <button {...props} onClick={(event) => {
      props.onClick?.(event);
      setCount((value) => value + 1);
    }}>
      Pressed {count}
    </button>
  );
}

describe("Tooltip", () => {
  it.each(["", null, undefined])("preserves trigger focus and state when content changes from %j and back", async (empty) => {
    const user = userEvent.setup();
    const { rerender } = render(<Tooltip content={empty}><StatefulTrigger /></Tooltip>);
    const trigger = screen.getByRole("button");
    await user.click(trigger);
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent("Pressed 1");

    rerender(<Tooltip content="Helpful hint"><StatefulTrigger /></Tooltip>);
    expect(screen.getByRole("button")).toBe(trigger);
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent("Pressed 1");

    rerender(<Tooltip content={empty}><StatefulTrigger /></Tooltip>);
    expect(screen.getByRole("button")).toBe(trigger);
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent("Pressed 1");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not leave an empty popup when controlled content is removed", async () => {
    const { rerender } = render(<Tooltip content="Helpful hint" open><button>Help</button></Tooltip>);
    const trigger = screen.getByRole("button", { name: "Help" });
    const popup = await screen.findByText("Helpful hint");

    rerender(<Tooltip content="" open><button>Help</button></Tooltip>);
    expect(screen.getByRole("button", { name: "Help" })).toBe(trigger);
    expect(popup).not.toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(trigger).not.toHaveAttribute("aria-describedby");
  });

  it("layers the positioner above modal content and preserves caller classes", async () => {
    render(
      <TooltipProvider>
        <Tooltip content="Save changes" open positionerProps={{ className: "custom-positioner" }}>
          <button>Save</button>
        </Tooltip>
      </TooltipProvider>,
    );

    const popup = await screen.findByText("Save changes");
    expect(popup.parentElement).toHaveClass("z-50", "outline-none", "custom-positioner");
    expect(popup).not.toHaveClass("z-50");
  });

  it("lets Base UI's instant state bypass popup motion", async () => {
    render(
      <TooltipProvider>
        <Tooltip content="Save changes" open>
          <button>Save</button>
        </Tooltip>
      </TooltipProvider>,
    );

    const popup = await screen.findByText("Save changes");
    expect(popup).toHaveClass("data-instant:transition-none");
    expect(popup).toHaveClass("transition-[opacity,scale,translate,filter]");
    expect(popup).not.toHaveClass("transition-none");
  });
});

describe("Tooltip visibility controls", () => {
  it("starts open and reports closure reasons and completion", async () => {
    const user = userEvent.setup();
    const changed = vi.fn(), completed = vi.fn();
    render(<Tooltip content="Initially visible" defaultOpen onOpenChange={changed} onOpenChangeComplete={completed}>
      <button>Hint</button>
    </Tooltip>);
    expect(await screen.findByText("Initially visible")).toBeVisible();
    await waitFor(() => expect(completed).toHaveBeenCalledWith(true));
    await user.keyboard("{Escape}");
    expect(changed).toHaveBeenCalledWith(false, expect.objectContaining({ reason: "escape-key" }));
    await waitFor(() => expect(completed).toHaveBeenCalledWith(false));
  });

  it("supports controlled state and cancellable change events", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return <Tooltip open={open} content="Controlled hint" onOpenChange={(next, details) => {
        changed(next, details.reason);
        if (details.reason === "escape-key") details.cancel();
        else setOpen(next);
      }}><button>Controlled trigger</button></Tooltip>;
    }
    render(<Controlled />);
    await user.tab();
    expect(await screen.findByText("Controlled hint")).toBeVisible();
    expect(changed).toHaveBeenCalledWith(true, "trigger-focus");
    await user.keyboard("{Escape}");
    expect(screen.getByText("Controlled hint")).toBeVisible();
  });

  it("disables the popup without disabling or remounting its trigger", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    const { rerender } = render(<Tooltip content="Saved hint" open onOpenChange={changed}><StatefulTrigger /></Tooltip>);
    const trigger = screen.getByRole("button");
    await user.click(trigger);
    rerender(<Tooltip content="Saved hint" open disabled onOpenChange={changed}><StatefulTrigger /></Tooltip>);
    expect(screen.getByRole("button")).toBe(trigger);
    expect(trigger).toHaveFocus();
    expect(trigger).toBeEnabled();
    expect(trigger).toHaveTextContent("Pressed 1");
    expect(changed).toHaveBeenCalledWith(false, expect.objectContaining({ reason: "disabled" }));
    await waitFor(() => expect(screen.queryByText("Saved hint")).not.toBeInTheDocument());
    rerender(<Tooltip content="Saved hint" open><StatefulTrigger /></Tooltip>);
    expect(await screen.findByText("Saved hint")).toBeVisible();
    expect(screen.getByRole("button")).toBe(trigger);
  });
});

describe("Tooltip composition", () => {
  it("passes refs, DOM props, custom rendering, portal settings, and live classes", async () => {
    const portalRef = createRef<HTMLDivElement>(), popupRef = createRef<HTMLDivElement>();
    const triggerRef = createRef<HTMLButtonElement>(), positionerRef = createRef<HTMLDivElement>();
    const host = document.createElement("div");
    document.body.append(host);
    const { unmount } = render(<TooltipRoot open>
      <TooltipTrigger ref={triggerRef}>Custom trigger</TooltipTrigger>
      <TooltipContent ref={popupRef} render={<section />} title="Details" side="bottom"
        portalProps={{ container: host, ref: portalRef, keepMounted: true }}
        positionerProps={{ ref: positionerRef, className: state => state.open ? "positioner-open" : "positioner-closed" }}
        className={state => state.open ? "popup-open" : "popup-closed"}>
        Custom content
      </TooltipContent>
    </TooltipRoot>);
    expect(await screen.findByText("Custom content")).toBe(popupRef.current);
    expect(popupRef.current?.tagName).toBe("SECTION");
    expect(popupRef.current).toHaveAttribute("title", "Details");
    expect(popupRef.current).toHaveClass("popup-open", "wrap-anywhere");
    expect(positionerRef.current).toHaveClass("positioner-open", "z-50");
    expect(host).toContainElement(portalRef.current);
    expect(portalRef.current).toContainElement(positionerRef.current);
    expect(triggerRef.current).toBe(screen.getByRole("button", { name: "Custom trigger" }));
    unmount(); host.remove();
  });

  it("allows each popup part to be composed separately", async () => {
    render(<TooltipRoot defaultOpen>
      <TooltipTrigger>Separate parts</TooltipTrigger>
      <TooltipPortal><TooltipPositioner side="right"><TooltipPopup>Assembled hint</TooltipPopup></TooltipPositioner></TooltipPortal>
    </TooltipRoot>);
    const popup = await screen.findByText("Assembled hint");
    expect(popup).toHaveAttribute("data-slot", "tooltip-content");
    expect(popup.parentElement).toHaveAttribute("data-slot", "tooltip-positioner");
  });

  it("connects detached triggers to one popup with typed payloads", async () => {
    const user = userEvent.setup();
    const handle = createTooltipHandle<{ label: string }>();
    render(<>
      <TooltipTrigger handle={handle} payload={{ label: "First payload" }}>First</TooltipTrigger>
      <TooltipTrigger handle={handle} payload={{ label: "Second payload" }}>Second</TooltipTrigger>
      <TooltipRoot handle={handle}>{({ payload }) => <TooltipContent>{payload?.label}</TooltipContent>}</TooltipRoot>
    </>);
    await user.tab();
    const popup = await screen.findByText("First payload");
    await user.tab();
    await waitFor(() => expect(popup).toHaveTextContent("Second payload"));
    expect(document.querySelectorAll('[data-slot="tooltip-content"]')).toHaveLength(1);
  });

  it("shares one group popup and isolates nested standalone tooltips", async () => {
    const user = userEvent.setup();
    render(<TooltipGroup delay={0}>
      <TooltipTrigger content="First hint">First grouped</TooltipTrigger>
      <TooltipTrigger content="Second hint">Second grouped</TooltipTrigger>
      <Tooltip content="Independent hint"><button>Standalone</button></Tooltip>
    </TooltipGroup>);
    await user.tab();
    const popup = await screen.findByText("First hint");
    await user.tab();
    await waitFor(() => expect(popup).toHaveTextContent("Second hint"));
    expect(document.querySelectorAll('[data-slot="tooltip-content"]')).toHaveLength(1);
    await user.tab();
    expect(await screen.findByText("Independent hint")).toBeVisible();
    expect(screen.getByRole("button", { name: "Standalone" })).toHaveFocus();
  });

  it("keeps empty and disabled group triggers usable without opening hints", async () => {
    const user = userEvent.setup(), clicked = vi.fn();
    render(<TooltipGroup delay={0}>
      <TooltipTrigger content="" onClick={clicked}>Empty</TooltipTrigger>
      <TooltipTrigger content="Disabled hint" disabled onClick={clicked}>Disabled hint trigger</TooltipTrigger>
    </TooltipGroup>);
    await user.tab();
    expect(screen.getByText("Empty")).toHaveFocus();
    await user.click(screen.getByText("Empty"));
    await user.click(screen.getByText("Disabled hint trigger"));
    expect(clicked).toHaveBeenCalledTimes(2);
    expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
  });
});
