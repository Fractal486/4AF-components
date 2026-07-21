import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "./toast";

function ToastHarness() {
  const toast = useToast();

  return (
    <button
      type="button"
      onClick={() =>
        toast.add({
          title: "Saved",
          actions: ["One", "Two", "Three", "Four"].map((children) => ({ children })),
        })
      }
    >
      Show toast
    </button>
  );
}

describe("Toast", () => {
  it("limits custom actions and dismisses a toast", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Two" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Three" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Four" })).not.toBeInTheDocument();

    fireEvent.click(document.querySelector('[aria-label="Dismiss"]')!);
    await waitFor(() => expect(screen.queryByText("Saved")).not.toBeInTheDocument());
  });
});
