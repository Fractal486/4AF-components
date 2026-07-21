import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
});
