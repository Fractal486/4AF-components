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
          description: "The changes are now live.",
          actions: ["One", "Two", "Three", "Four"].map((children) => ({ children })),
        })
      }
    >
      Show toast
    </button>
  );
}

function TitleOnlyToastHarness() {
  const toast = useToast();

  return (
    <button
      type="button"
      onClick={() =>
        toast.add({
          title: "Saved",
          description: "This description is intentionally hidden.",
          variant: "title-only",
        })
      }
    >
      Show title-only toast
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
    expect(screen.getByText("The changes are now live.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Two" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Three" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Four" })).not.toBeInTheDocument();

    fireEvent.click(document.querySelector('[aria-label="Dismiss"]')!);
    await waitFor(() => expect(screen.queryByText("Saved")).not.toBeInTheDocument());
  });

  it("supports a title-only variant", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TitleOnlyToastHarness />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show title-only toast" }));

    const title = await screen.findByRole("heading", { name: "Saved" });
    expect(title.closest('[data-variant="title-only"]')).not.toBeNull();
    expect(title.parentElement).toHaveClass("self-center");
    expect(screen.queryByText("This description is intentionally hidden.")).not.toBeInTheDocument();
  });
});
