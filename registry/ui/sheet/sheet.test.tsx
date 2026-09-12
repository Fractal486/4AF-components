import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Sheet, SheetClose, SheetContent } from "./sheet";

describe("Sheet", () => {
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
