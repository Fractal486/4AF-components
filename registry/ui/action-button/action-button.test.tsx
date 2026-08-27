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

  it("centres a label-only action despite the reserved status glyph slot", () => {
    render(<ActionButton action={() => undefined}>Save</ActionButton>);

    expect(screen.getByRole("button").firstElementChild).toHaveClass("-translate-x-3");
  });

  it("centres the pending status icon and label as a group", async () => {
    let resolveAction: () => void;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(
      <ActionButton action={action} size="md" labels={{ pending: "Generating" }}>
        Generate
      </ActionButton>,
    );

    const button = screen.getByRole("button", { name: "Generate" });
    const content = button.querySelector('[data-slot="morph"]')?.parentElement;

    expect(content).not.toBeNull();
    expect(content).toHaveClass("-translate-x-3");

    fireEvent.click(button);
    expect(button).toHaveAttribute("data-status", "pending");
    expect(content).not.toHaveClass("-translate-x-3");

    await act(async () => resolveAction!());
  });

  it("morphs the glyph without dragging the label through the swap", () => {
    render(
      <ActionButton action={() => new Promise(() => {})} icon={<span>@</span>}>
        Save
      </ActionButton>,
    );

    // Not by name: the stand-in glyph is real text, so it joins the accessible name.
    const button = screen.getByRole("button");
    // Two boxes, not one: the loader is a text glyph and about half the advance width of
    // an icon, so a single Morph would centre the narrower state and slide the label.
    const morphs = button.querySelectorAll('[data-slot="morph"]');
    expect(morphs).toHaveLength(2);

    const live = () =>
      [...morphs[1]!.children].filter((child) => child.getAttribute("aria-hidden") !== "true");
    const before = live()[0];

    fireEvent.click(button);
    expect(button).toHaveAttribute("data-status", "pending");

    // No per-state label was given, so nothing about the label changed — and an unchanged
    // label must not be scaled and blurred through a swap it had no part in. A key change
    // would leave the outgoing copy on screen beside the incoming one.
    expect(live()).toHaveLength(1);
    expect(live()[0]).toBe(before);
  });
});
