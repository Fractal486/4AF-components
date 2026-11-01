import { createRef, useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  createAlertDialogHandle, AlertDialog, AlertDialogAction, AlertDialogBackdrop,
  AlertDialogBody, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogPopup, AlertDialogPortal,
  AlertDialogTitle, AlertDialogTrigger,
} from "./alert-dialog";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "../dialog/dialog";

describe("AlertDialog", () => {
  it("keeps an uncontrolled alert dialog open when its close is canceled", async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog defaultOpen onOpenChange={(_, details) => details.cancel()}>
        <AlertDialogContent>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("retains confirmation semantics and dismisses with Escape, not the backdrop", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(<AlertDialog onOpenChange={changed}>
      <AlertDialogTrigger>Delete project</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        <AlertDialogFooter><AlertDialogCancel /><AlertDialogAction>Delete</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);
    const trigger = screen.getByRole("button", { name: "Delete project" });
    await user.click(trigger);
    const popup = screen.getByRole("alertdialog", { name: "Confirm deletion" });
    expect(popup).toHaveAccessibleDescription("This cannot be undone.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    changed.mockClear();
    await user.click(document.querySelector('[data-slot="dialog-backdrop"]')!);
    expect(popup).toBeInTheDocument();
    expect(changed).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("runs action handlers before closing and respects prevented actions", async () => {
    const user = userEvent.setup();
    const action = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(<AlertDialog defaultOpen><AlertDialogContent>
      <AlertDialogTitle>Confirm</AlertDialogTitle>
      <AlertDialogAction onClick={action}>Apply</AlertDialogAction>
    </AlertDialogContent></AlertDialog>);
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    action.mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it.each(["dialog", "alert"] as const)("shares nesting with a %s parent and restores parent focus", async (kind) => {
    const user = userEvent.setup();
    const Parent = kind === "dialog" ? Dialog : AlertDialog;
    const ParentContent = kind === "dialog" ? DialogContent : AlertDialogContent;
    const ParentTitle = kind === "dialog" ? DialogTitle : AlertDialogTitle;
    const Child = kind === "dialog" ? AlertDialog : Dialog;
    const ChildContent = kind === "dialog" ? AlertDialogContent : DialogContent;
    const ChildTitle = kind === "dialog" ? AlertDialogTitle : DialogTitle;
    const ChildTrigger = kind === "dialog" ? AlertDialogTrigger : DialogTrigger;
    const ChildClose = kind === "dialog" ? AlertDialogCancel : DialogClose;
    render(<Parent defaultOpen><ParentContent>
      <ParentTitle>Parent</ParentTitle>
      <Child><ChildTrigger>Open child</ChildTrigger><ChildContent>
        <ChildTitle>Child</ChildTitle><ChildClose>Close child</ChildClose>
      </ChildContent></Child>
    </ParentContent></Parent>);
    const parentRole = kind === "dialog" ? "dialog" : "alertdialog";
    const childRole = kind === "dialog" ? "alertdialog" : "dialog";
    const parent = screen.getByRole(parentRole, { name: "Parent" });
    const trigger = within(parent).getByRole("button", { name: "Open child" });
    await user.click(trigger);
    expect(parent).toHaveAttribute("data-nested-dialog-open");
    expect(screen.getByRole(childRole, { name: "Child" })).toHaveAttribute("data-nested");
    expect(document.querySelectorAll('[data-slot="dialog-backdrop"]')).toHaveLength(2);
    expect(document.querySelector('[data-slot="dialog-backdrop"][data-nested]')).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole(childRole, { name: "Child" })).not.toBeInTheDocument());
    expect(screen.getByRole(parentRole, { name: "Parent" })).toBeInTheDocument();
    await waitFor(() => expect(parent).not.toHaveAttribute("data-nested-dialog-open"));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("shares scrolling and custom surfaces through the composed popup API", async () => {
    const user = userEvent.setup();
    const popupRef = createRef<HTMLDivElement>();
    const viewportRef = createRef<HTMLDivElement>();
    const backdropRef = createRef<HTMLDivElement>();
    render(<AlertDialog defaultOpen>
      <AlertDialogPortal keepMounted>
        <AlertDialogBackdrop ref={backdropRef} className={state => state.open ? "backdrop-open" : "backdrop-closed"} />
        <AlertDialogPopup ref={popupRef} autoSize={false} style={{ height: "400px" }} render={<section />}
          className={state => state.open ? "popup-open" : "popup-closed"}>
          <AlertDialogHeader><AlertDialogTitle>Review</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogBody viewportRef={viewportRef}><input aria-label="Name" /></AlertDialogBody>
          <AlertDialogFooter><AlertDialogCancel /></AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>);
    expect(popupRef.current?.tagName).toBe("SECTION");
    expect(popupRef.current).toHaveAttribute("data-dialog-frame");
    expect(popupRef.current).toHaveAttribute("role", "alertdialog");
    expect(popupRef.current).toHaveStyle({ height: "400px" });
    expect(popupRef.current).toHaveClass("popup-open");
    expect(viewportRef.current).toContainElement(screen.getByRole("textbox"));
    expect(viewportRef.current).not.toContainElement(screen.getByRole("heading"));
    expect(viewportRef.current).not.toContainElement(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("heading").parentElement).not.toHaveAttribute("data-close");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(popupRef.current).toHaveClass("popup-closed"));
    expect(popupRef.current).toHaveAttribute("hidden");
    expect(backdropRef.current).toHaveClass("backdrop-closed");
  });

  it("retains content through the shared convenience portal and reports completion", async () => {
    const user = userEvent.setup();
    const portal = document.createElement("div");
    document.body.append(portal);
    const completed = vi.fn();
    function Counter() {
      const [count, setCount] = useState(0);
      return <button onClick={() => setCount(count + 1)}>Count {count}</button>;
    }
    const { unmount } = render(<AlertDialog onOpenChangeComplete={completed}>
      <AlertDialogTrigger>Open</AlertDialogTrigger>
      <AlertDialogContent portalContainer={portal} portalProps={{ keepMounted: true }} backdropClassName="custom-backdrop">
        <AlertDialogTitle>Retained</AlertDialogTitle><Counter /><AlertDialogCancel />
      </AlertDialogContent>
    </AlertDialog>);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(portal.querySelector('[role="alertdialog"]')).toBeInTheDocument();
    expect(portal.querySelector(".custom-backdrop")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Count 0" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(completed).toHaveBeenCalledWith(false));
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("button", { name: "Count 1" })).toBeInTheDocument();
    expect(completed).toHaveBeenCalledWith(true);
    unmount();
    portal.remove();
  });

  it("supports typed detached triggers through its own confirmation root", async () => {
    const user = userEvent.setup();
    const handle = createAlertDialogHandle<{ name: string }>();
    render(<>
      <AlertDialogTrigger handle={handle} payload={{ name: "Alex" }}>Remove Alex</AlertDialogTrigger>
      <AlertDialogTrigger handle={handle} payload={{ name: "Taylor" }}>Remove Taylor</AlertDialogTrigger>
      <AlertDialog handle={handle}>{({ payload }) => <AlertDialogContent>
        <AlertDialogTitle>Remove {payload?.name}?</AlertDialogTitle><AlertDialogCancel />
      </AlertDialogContent>}</AlertDialog>
    </>);
    for (const name of ["Alex", "Taylor"]) {
      const trigger = screen.getByRole("button", { name: `Remove ${name}` });
      await user.click(trigger);
      expect(screen.getByRole("alertdialog", { name: `Remove ${name}?` })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  });
});
