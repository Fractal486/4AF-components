import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { ActionButton } from "./action-button";

afterEach(() => vi.useRealTimers());

describe("ActionButton", () => {
  it("prevents double submits and returns to idle after a successful async action", async () => {
    vi.useFakeTimers();
    let resolveAction: () => void;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(
      <ActionButton action={action} labels={{ pending: "Saving", success: "Saved" }} revertAfter={200}>
        Save
      </ActionButton>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(action).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute("data-status", "pending");

    await act(async () => resolveAction!());
    expect(button).toHaveAttribute("data-status", "success");

    await act(async () => vi.advanceTimersByTime(200));
    expect(button).toHaveAttribute("data-status", "idle");
  });

  it("shows an error outcome when its action rejects", async () => {
    render(
      <ActionButton
        action={() => Promise.reject(new Error("Save failed"))}
        labels={{ error: "Try again" }}
      >
        Save
      </ActionButton>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    fireEvent.click(button);

    // Wait on the status, not on the label. Morph renders every state at once — the
    // inactive ones as invisible sizers — so "Try again" is in the DOM from the first
    // render and `findByText` resolves before the action has even rejected.
    await waitFor(() => expect(button).toHaveAttribute("data-status", "error"));
  });
});
