import { createRef, useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  createDialogHandle, Dialog, DialogBackdrop, DialogBody, DialogClose, DialogContent,
  DialogDescription, DialogFooter, DialogHeader, DialogPopup, DialogPortal, DialogTitle, DialogTrigger,
} from "./dialog";

describe("Dialog composition", () => {
  it("opens one dialog from detached typed triggers and returns focus to the correct trigger", async () => {
    const user = userEvent.setup();
    const handle = createDialogHandle<{ name: string }>();
    render(<>
      <DialogTrigger handle={handle} payload={{ name: "Alex" }}>Edit Alex</DialogTrigger>
      <DialogTrigger handle={handle} payload={{ name: "Taylor" }}>Edit Taylor</DialogTrigger>
      <Dialog handle={handle}>
        {({ payload }) => <DialogContent showClose={false}>
          <DialogTitle>Edit {payload?.name}</DialogTitle>
          <DialogFooter showCloseButton closeLabel="Finish" />
        </DialogContent>}
      </Dialog>
    </>);
    for (const name of ["Alex", "Taylor"]) {
      const trigger = screen.getByRole("button", { name: `Edit ${name}` });
      await user.click(trigger);
      expect(screen.getByRole("dialog", { name: `Edit ${name}` })).toBeInTheDocument();
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      await user.click(screen.getByRole("button", { name: "Finish" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  });

  it("supports caller-composed surfaces, custom elements, refs and live state classes", async () => {
    const user = userEvent.setup();
    const popupRef = createRef<HTMLDivElement>();
    const backdropRef = createRef<HTMLDivElement>();
    const portalRef = createRef<HTMLDivElement>();
    const popupState = vi.fn((state: { open: boolean }) => state.open ? "popup-open" : "popup-closed");
    render(<Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogPortal ref={portalRef} keepMounted>
        <DialogBackdrop ref={backdropRef} render={<aside />} className={state => state.open ? "backdrop-open" : "backdrop-closed"} />
        <DialogPopup ref={popupRef} showClose={false} render={(props, state) => <section {...props} data-render-open={state.open} />} className={popupState}>
          <DialogTitle className={() => "custom-title"}>Custom dialog</DialogTitle>
          <DialogDescription render={<div />} className={() => "custom-description"}>A <a href="#details">description link</a>.</DialogDescription>
          <DialogClose>Dismiss</DialogClose>
        </DialogPopup>
      </DialogPortal>
    </Dialog>);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(popupRef.current?.tagName).toBe("SECTION");
    expect(popupRef.current).toHaveClass("popup-open");
    expect(popupRef.current).toHaveAttribute("data-render-open", "true");
    expect(backdropRef.current?.tagName).toBe("ASIDE");
    expect(backdropRef.current).toHaveClass("backdrop-open");
    expect(portalRef.current).toContainElement(popupRef.current);
    expect(screen.getByRole("heading")).toHaveClass("custom-title");
    expect(screen.getByText(/A/).closest('[data-slot="dialog-description"]')).toHaveClass("custom-description");
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(popupRef.current).toHaveClass("popup-closed"));
    expect(popupRef.current).toHaveAttribute("hidden");
    expect(backdropRef.current).toHaveClass("backdrop-closed");
  });

  it("retains local content with keepMounted and calls visibility completion", async () => {
    const user = userEvent.setup();
    const completed = vi.fn();
    function Counter() {
      const [count, setCount] = useState(0);
      return <button onClick={() => setCount(count + 1)}>Count {count}</button>;
    }
    render(<Dialog onOpenChangeComplete={completed}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent portalProps={{ keepMounted: true }}>
        <DialogTitle>Retained dialog</DialogTitle><Counter />
      </DialogContent>
    </Dialog>);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Count 0" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(completed).toHaveBeenCalledWith(false));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("button", { name: "Count 1" })).toBeInTheDocument();
    expect(completed).toHaveBeenCalledWith(true);
  });

  it("keeps header and footer outside the body viewport and forwards body refs", () => {
    const bodyRef = createRef<HTMLDivElement>();
    const viewportRef = createRef<HTMLDivElement>();
    render(<Dialog open><DialogContent showClose={false}>
      <DialogHeader><DialogTitle>Profile</DialogTitle></DialogHeader>
      <DialogBody ref={bodyRef} viewportRef={viewportRef} contentClassName="custom-content"><input aria-label="Name" /></DialogBody>
      <DialogFooter showCloseButton />
    </DialogContent></Dialog>);
    expect(bodyRef.current).toContainElement(viewportRef.current);
    expect(viewportRef.current).toContainElement(screen.getByRole("textbox"));
    expect(viewportRef.current).not.toContainElement(screen.getByRole("heading"));
    expect(viewportRef.current).not.toContainElement(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByRole("textbox").parentElement).toHaveClass("custom-content");
    expect(screen.getByRole("heading").parentElement).not.toHaveAttribute("data-close");
  });

  it("cancels the built-in footer close and supports externally controlled closing", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn((_: boolean, details: { cancel(): void }) => details.cancel());
    const content = (open: boolean) => <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false}><DialogTitle>Confirm</DialogTitle><DialogFooter showCloseButton /></DialogContent>
    </Dialog>;
    const { rerender } = render(content(true));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    rerender(content(false));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("layers nested dialogs and closes only the top one with Escape", async () => {
    const user = userEvent.setup();
    render(<Dialog defaultOpen><DialogContent>
      <DialogTitle>Parent</DialogTitle>
      <Dialog>
        <DialogTrigger>Open child</DialogTrigger>
        <DialogContent><DialogTitle>Child</DialogTitle><DialogFooter showCloseButton /></DialogContent>
      </Dialog>
    </DialogContent></Dialog>);
    const parent = screen.getByRole("dialog", { name: "Parent" });
    const trigger = within(parent).getByRole("button", { name: "Open child" });
    await user.click(trigger);
    expect(parent).toHaveAttribute("data-nested-dialog-open");
    expect(screen.getByRole("dialog", { name: "Child" })).toHaveAttribute("data-nested");
    expect(document.querySelectorAll('[data-slot="dialog-backdrop"]')).toHaveLength(2);
    expect(document.querySelector('[data-slot="dialog-backdrop"][data-nested]')).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Child" })).not.toBeInTheDocument());
    expect(screen.getByRole("dialog", { name: "Parent" })).toBeInTheDocument();
    await waitFor(() => expect(parent).not.toHaveAttribute("data-nested-dialog-open"));
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
