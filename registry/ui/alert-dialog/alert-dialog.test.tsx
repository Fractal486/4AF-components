import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertDialog, AlertDialogCancel, AlertDialogContent } from "./alert-dialog";

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
});
