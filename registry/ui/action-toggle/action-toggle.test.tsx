import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { ActionToggle } from "./action-toggle";

afterEach(() => vi.useRealTimers());

describe("ActionToggle", () => {
  it("waits for the action before it lands, and only then reports the change", async () => {
    let finish: () => void;
    const action = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const onPressedChange = vi.fn();

    render(
      <ActionToggle action={action} labels={{ pressed: "Following" }} onPressedChange={onPressedChange}>
        Follow
      </ActionToggle>,
    );

    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    // One run, and the state has not moved yet — the label still reads Follow and
    // nothing has been announced as changed.
    expect(action).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("data-status", "pending");
    expect(onPressedChange).not.toHaveBeenCalled();

    await act(async () => finish!());

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveTextContent("Following");
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it("leaves the state alone when the action fails", async () => {
    vi.useFakeTimers();
    const action = vi.fn(() => Promise.reject(new Error("offline")));
    const onPressedChange = vi.fn();
    const onError = vi.fn();

    render(
      <ActionToggle
        action={action}
        labels={{ pressed: "Following" }}
        revertAfter={200}
        onPressedChange={onPressedChange}
        onError={onError}
      >
        Follow
      </ActionToggle>,
    );

    const toggle = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(toggle);
    });

    // Nothing moved, so there is nothing to roll back — the failure is the whole story.
    expect(toggle).toHaveAttribute("data-status", "error");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();

    await act(async () => vi.advanceTimersByTime(200));
    expect(toggle).toHaveAttribute("data-status", "idle");
    expect(toggle).toHaveTextContent("Follow");
  });

  it("toggles back off, telling the action which way it's going", async () => {
    const action = vi.fn(() => Promise.resolve());

    render(
      <ActionToggle action={action} defaultPressed labels={{ pressed: "Following" }}>
        Follow
      </ActionToggle>,
    );

    const toggle = screen.getByRole("button");
    expect(toggle).toHaveTextContent("Following");

    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(action).toHaveBeenCalledWith(false);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveTextContent("Follow");
  });

  it("holds a controlled value until its owner moves it", async () => {
    const action = vi.fn(() => Promise.resolve());
    const onPressedChange = vi.fn();

    render(
      <ActionToggle action={action} pressed={false} onPressedChange={onPressedChange}>
        Follow
      </ActionToggle>,
    );

    const toggle = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(toggle);
    });

    // The owner is told, and nothing else happens until it says so.
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
