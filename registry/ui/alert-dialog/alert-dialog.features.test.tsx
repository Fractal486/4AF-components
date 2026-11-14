import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { vi } from "vitest";
import { LoaderProvider } from "@/registry/lib/loader";
import {
  AlertDialog, AlertDialogAction, AlertDialogBody, AlertDialogCancel, AlertDialogClose,
  AlertDialogContent, AlertDialogFooter, AlertDialogFooterItem, AlertDialogHeader,
  AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from "./alert-dialog";

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe("Alert Dialog confirmation features", () => {
  it("awaits success, locks every dismissal route and preserves focus while loading", async () => {
    const user = userEvent.setup(); const work = deferred(); const action = vi.fn(() => work.promise);
    const other = vi.fn(); const changed = vi.fn(); const actionsRef = createRef<{ close(): void; unmount(): void }>();
    render(<LoaderProvider loader={<span data-testid="custom-loader" />}>
      <AlertDialog defaultOpen disablePointerDismissal={false} onOpenChange={changed} actionsRef={actionsRef}>
        <AlertDialogContent><AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel /><AlertDialogAction onClick={action}>Delete</AlertDialogAction>
            <AlertDialogAction onClick={other}>Archive</AlertDialogAction><AlertDialogClose>Other close</AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LoaderProvider>);
    const button = screen.getByRole("button", { name: "Delete" });
    await user.click(button);
    expect(button).toHaveAttribute("data-loading", "true");
    expect(button).toHaveFocus();
    expect(button).not.toBeDisabled();
    expect(screen.getByTestId("custom-loader")).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-busy", "true");
    await user.click(button); await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Archive" }));
    await user.click(screen.getByRole("button", { name: "Other close" }));
    await user.click(document.querySelector('[data-slot="dialog-backdrop"]')!);
    await user.keyboard("{Escape}");act(() => actionsRef.current?.close());
    expect(action).toHaveBeenCalledOnce(); expect(other).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled(); expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await act(async () => work.resolve());
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(changed).toHaveBeenCalledExactlyOnceWith(false, expect.anything());
  });

  it("stays open on rejection and allows a successful retry", async () => {
    const user = userEvent.setup();const first = deferred();const second = deferred();
    const failure = new Error("Failed");const onError = vi.fn();
    const action = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<AlertDialog defaultOpen><AlertDialogContent><AlertDialogTitle>Confirm</AlertDialogTitle>
      <AlertDialogFooter><AlertDialogCancel /><AlertDialogAction onClick={action} onError={onError}>Save</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent></AlertDialog>);
    const button = screen.getByRole("button", { name: "Save" });await user.click(button);
    await act(async () => first.reject(failure));expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();expect(button).not.toHaveAttribute("aria-disabled", "true");
    await user.click(button);await act(async () => second.resolve());
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("reports thrown actions without dismissing", async () => {
    const user = userEvent.setup();const error = new Error("Invalid");const onError = vi.fn();
    render(<AlertDialog defaultOpen><AlertDialogContent><AlertDialogTitle>Confirm</AlertDialogTitle>
      <AlertDialogAction onClick={() => { throw error; }} onError={onError}>Save</AlertDialogAction>
    </AlertDialogContent></AlertDialog>);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onError).toHaveBeenCalledWith(error);expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("honors prevented success and canceled close requests after asynchronous work", async () => {
    const user = userEvent.setup();const work = deferred();const changed = vi.fn((_: boolean, details: { cancel(): void }) => details.cancel());
    render(<AlertDialog defaultOpen onOpenChange={changed}><AlertDialogContent><AlertDialogTitle>Confirm</AlertDialogTitle>
      <AlertDialogAction onClick={event => { event.preventDefault(); return work.promise; }}>Save</AlertDialogAction>
      <AlertDialogCancel />
    </AlertDialogContent></AlertDialog>);
    await user.click(screen.getByRole("button", { name: "Save" }));await act(async () => work.resolve());
    expect(changed).not.toHaveBeenCalled();expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));expect(changed).toHaveBeenCalledOnce();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("ignores an old promise after a controlled close and reopening", async () => {
    const user = userEvent.setup();const first = deferred();const second = deferred();const changed = vi.fn();
    const action = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const view = (open: boolean) => <AlertDialog open={open} onOpenChange={changed}><AlertDialogContent portalProps={{ keepMounted: true }}>
      <AlertDialogTitle>Confirm</AlertDialogTitle><AlertDialogAction onClick={action}>Save</AlertDialogAction>
    </AlertDialogContent></AlertDialog>;
    const { rerender } = render(view(true));await user.click(screen.getByRole("button", { name: "Save" }));
    rerender(view(false));rerender(view(true));await user.click(screen.getByRole("button", { name: "Save" }));
    await act(async () => first.resolve());expect(changed).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-busy", "true");
    await act(async () => second.resolve());expect(changed).toHaveBeenCalledExactlyOnceWith(false, expect.anything());
  });

  it("ignores outcomes after unmount", async () => {
    const user = userEvent.setup();const work = deferred();const changed = vi.fn();const onError = vi.fn();
    const { unmount } = render(<AlertDialog defaultOpen onOpenChange={changed}><AlertDialogContent>
      <AlertDialogTitle>Confirm</AlertDialogTitle><AlertDialogAction onClick={() => work.promise} onError={onError}>Save</AlertDialogAction>
    </AlertDialogContent></AlertDialog>);
    await user.click(screen.getByRole("button", { name: "Save" }));unmount();
    await act(async () => work.reject(new Error("late")));expect(changed).not.toHaveBeenCalled();expect(onError).not.toHaveBeenCalled();
  });

  it("focuses Cancel after actions and content, with an explicit override available", async () => {
    const user = userEvent.setup();const input = createRef<HTMLInputElement>();
    const view = (override: boolean) => <AlertDialog><AlertDialogTrigger>Open</AlertDialogTrigger>
      <AlertDialogContent initialFocus={override ? input : undefined}>
        <AlertDialogTitle>Confirm</AlertDialogTitle><AlertDialogBody><input ref={input} aria-label="Name" /></AlertDialogBody>
        <AlertDialogFooter><AlertDialogAction>Delete</AlertDialogAction><AlertDialogCancel /></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>;
    const { rerender } = render(view(false));await user.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    await user.keyboard("{Escape}");rerender(view(true));await user.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(input.current).toHaveFocus());
  });

  it("allows outside dismissal only when enabled and preserves content when changed", async () => {
    const user = userEvent.setup();const view = (allow: boolean) => <AlertDialog defaultOpen disablePointerDismissal={!allow}>
      <AlertDialogContent><AlertDialogTitle>Confirm</AlertDialogTitle><input aria-label="Draft" /><AlertDialogCancel /></AlertDialogContent>
    </AlertDialog>;
    const { rerender } = render(view(false));await user.type(screen.getByRole("textbox"), "Keep this");
    await user.click(document.querySelector('[data-slot="dialog-backdrop"]')!);expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    rerender(view(true));expect(screen.getByRole("textbox")).toHaveValue("Keep this");
    await user.click(document.querySelector('[data-slot="dialog-backdrop"]')!);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("navigates footer actions, skips disabled controls, wraps, and follows RTL", async () => {
    const user = userEvent.setup();
    render(<AlertDialog defaultOpen><AlertDialogContent dir="rtl"><AlertDialogTitle>Confirm</AlertDialogTitle>
      <AlertDialogFooter>
        <AlertDialogCancel /><AlertDialogAction disabled>Unavailable</AlertDialogAction>
        <AlertDialogFooterItem><button>More</button></AlertDialogFooterItem><AlertDialogAction>Save</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent></AlertDialog>);
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    await user.tab();await waitFor(() => expect(screen.getByRole("button", { name: "More" })).toHaveFocus());
    await user.tab({ shift: true });await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    await user.keyboard("{ArrowLeft}");await waitFor(() => expect(screen.getByRole("button", { name: "More" })).toHaveFocus());
    await user.keyboard("{ArrowDown}");await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toHaveFocus());
    await user.keyboard("{ArrowLeft}");await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    await user.keyboard("{ArrowRight}");await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toHaveFocus());
    await user.keyboard("{Home}");await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
  });

  it("renders customizable decorative media inside the shared header", () => {
    const ref = createRef<HTMLDivElement>();
    render(<AlertDialog open><AlertDialogContent><AlertDialogHeader>
      <AlertDialogMedia ref={ref} variant="destructive" asChild><span><svg aria-label="Delete icon" /></span></AlertDialogMedia>
      <AlertDialogTitle>Delete project?</AlertDialogTitle>
    </AlertDialogHeader><AlertDialogCancel /></AlertDialogContent></AlertDialog>);
    expect(ref.current?.tagName).toBe("SPAN");expect(ref.current).toHaveAttribute("data-variant", "destructive");
    expect(ref.current).toHaveAttribute("aria-hidden", "true");expect(screen.getByRole("alertdialog")).toHaveAccessibleName("Delete project?");
  });
});
