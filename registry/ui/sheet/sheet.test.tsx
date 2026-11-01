import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./sheet";

describe("Sheet", () => {
  it("customizes the animated panel and backdrop without losing refs, events, or dismissal", async () => {
    const user = userEvent.setup();
    const panelRef = createRef<HTMLDivElement>();
    const overlayRef = createRef<HTMLDivElement>();
    const onDragStart = vi.fn();
    const onExitComplete = vi.fn();
    render(
      <Sheet defaultOpen>
        <SheetContent
          ref={panelRef}
          render={(props, state) => <section {...props} data-custom-open={state.open} />}
          className={(state) => state.open ? "custom-panel" : "closed-panel"}
          style={(state) => ({ paddingLeft: state.open ? 7 : 0 })}
          onDragStart={onDragStart}
          onExitComplete={onExitComplete}
          overlayProps={{ ref: overlayRef, render: <aside />, className: (state) => state.open ? "custom-overlay" : "closed-overlay" }}
        >
          <SheetHeader><SheetTitle>Settings</SheetTitle></SheetHeader>
        </SheetContent>
      </Sheet>,
    );
    const panel = screen.getByRole("dialog", { name: "Settings" });
    expect(panel.tagName).toBe("SECTION");
    expect(panel).toHaveClass("custom-panel", "fixed");
    expect(panel).toHaveStyle({ paddingLeft: "7px" });
    expect(panelRef.current).toBe(panel);
    expect(overlayRef.current?.tagName).toBe("ASIDE");
    expect(overlayRef.current).toHaveClass("custom-overlay", "fixed");
    fireEvent.dragStart(panel);
    expect(onDragStart).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(onExitComplete).toHaveBeenCalledTimes(1));
    expect(panelRef.current).toBeNull();
    expect(overlayRef.current).toBeNull();
  });

  it("uses a custom portal container and reserves header space only when the close button is shown", () => {
    const container = document.createElement("div");
    document.body.append(container);
    function Fixture({ showClose }: { showClose: boolean }) {
      return <Sheet defaultOpen><SheetContent showClose={showClose} portalProps={{ container }}>
        <SheetHeader data-testid="header"><SheetTitle className={() => "custom-title"}>Settings</SheetTitle>
          <SheetDescription className={() => "custom-description"}>Details</SheetDescription></SheetHeader>
      </SheetContent></Sheet>;
    }
    const { rerender, unmount } = render(<Fixture showClose />);
    expect(container).toContainElement(screen.getByRole("dialog"));
    expect(screen.getByTestId("header")).toHaveAttribute("data-show-close");
    expect(screen.getByText("Settings")).toHaveClass("custom-title");
    expect(screen.getByText("Details")).toHaveClass("custom-description");
    rerender(<Fixture showClose={false} />);
    expect(screen.getByTestId("header")).not.toHaveAttribute("data-show-close");
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    unmount();
    container.remove();
  });

  it("keeps an uncontrolled sheet open when its close is canceled", async () => {
    const user = userEvent.setup();
    render(
      <Sheet defaultOpen onOpenChange={(_, details) => details.cancel()}>
        <SheetContent>
          <SheetClose>Close sheet</SheetClose>
        </SheetContent>
      </Sheet>,
    );

    await user.click(screen.getByRole("button", { name: "Close sheet" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("reports when the exit has finished and the panel has left", async () => {
    // A host that only knows whether the sheet should exist has nowhere else to learn
    // this: unmounting on the press cuts the exit off before it starts, and a timeout is
    // a guess that drifts the moment the animation changes.
    const user = userEvent.setup();
    const onExitComplete = vi.fn();

    render(
      <Sheet defaultOpen>
        <SheetContent onExitComplete={onExitComplete}>
          <SheetClose>Close sheet</SheetClose>
        </SheetContent>
      </Sheet>,
    );

    expect(onExitComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Close sheet" }));

    await waitFor(() => expect(onExitComplete).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
