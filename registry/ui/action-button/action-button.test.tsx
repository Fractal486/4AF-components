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

  it("uses the drawn check glyph for the success state", async () => {
    render(<ActionButton action={() => undefined} icon={<span>@</span>} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => expect(button).toHaveAttribute("data-status", "success"));

    const checks = button.querySelectorAll('[data-slot="action-button-check"]');
    expect(checks).toHaveLength(2);
    expect(checks[1]?.querySelector("path")).toHaveAttribute(
      "d",
      "M4 12.5l5 5L20 6.5",
    );
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

  it("places the glyph after the label with iconPosition end", () => {
    render(
      <ActionButton action={() => undefined} icon={<svg data-testid="glyph" />} iconPosition="end">
        Save
      </ActionButton>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("data-icon-position", "end");
    const group = button.querySelector('[data-slot="action-button-group"]');
    // The label's box comes first and the glyph's box last.
    expect(group?.firstElementChild).toHaveTextContent("Save");
    expect(group?.lastElementChild?.querySelector('[data-testid="glyph"]')).not.toBeNull();
  });

  it("nudges a label-only action the other way when the glyph slot is at the end", () => {
    render(
      <ActionButton action={() => undefined} iconPosition="end">
        Save
      </ActionButton>,
    );

    const content = screen
      .getByRole("button")
      .querySelector('[data-slot="action-button-content"]');
    expect(content?.firstElementChild).toHaveClass("translate-x-3");
  });

  it("centres a label-only action despite the reserved status glyph slot", () => {
    render(<ActionButton action={() => undefined}>Save</ActionButton>);

    const content = screen
      .getByRole("button")
      .querySelector('[data-slot="action-button-content"]');

    expect(content?.firstElementChild).toHaveClass("-translate-x-3");
    // The offset goes when a status glyph arrives; the label slides there, never jumps.
    expect(content?.firstElementChild).toHaveClass("transition-[translate]");
  });

  it("fits a label-only action to its showing state with sizing=\"current\"", async () => {
    let resolveAction: () => void;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(
      <ActionButton action={action} sizing="current" labels={{ pending: "Saving" }}>
        Save
      </ActionButton>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    const group = button.querySelector('[data-slot="action-button-group"]');
    const morphs = button.querySelectorAll('[data-slot="morph"]');

    expect(button).toHaveAttribute("data-sizing", "current");
    expect([...morphs].map((morph) => morph.getAttribute("data-sizing"))).toEqual(["current", "current"]);
    // Nothing is reserved, so there is no offset to centre against — only the empty
    // glyph's gap to drop, which returns with the loader.
    expect(group).not.toHaveClass("-translate-x-3");
    expect(group).toHaveClass("gap-0");

    fireEvent.click(button);
    expect(group).toHaveClass("gap-[inherit]");

    await act(async () => resolveAction!());
  });

  it("forwards the button shape", () => {
    render(
      <ActionButton action={() => undefined} shape="pill">
        Save
      </ActionButton>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-shape", "pill");
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

  it("centres an icon-only pending state over the reserved labelled content", async () => {
    let resolveAction: () => void;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(
      <ActionButton
        action={action}
        pendingMode="icon"
        labels={{ pending: "Deploying", success: "Deployed" }}
      >
        Deploy
      </ActionButton>,
    );

    const button = screen.getByRole("button", { name: "Deploy" });
    const content = button.querySelector('[data-slot="action-button-content"]');
    const group = content?.firstElementChild;
    const pendingIcon = content?.querySelector('[data-slot="action-button-pending-icon"]');

    expect(button).toHaveAttribute("data-pending-mode", "icon");
    expect(content).toHaveClass("inline-grid");
    expect(group).not.toBeNull();
    expect(pendingIcon).toHaveClass("absolute", "inset-0", "place-items-center");
    expect(group).toHaveAttribute("data-state", "visible");
    expect(pendingIcon).toHaveAttribute("data-state", "hidden");

    fireEvent.click(button);

    expect(button).toHaveAttribute("data-status", "pending");
    // The label morphs out as the loader morphs in; neither is cut.
    expect(group).toHaveAttribute("data-state", "hidden");
    expect(pendingIcon).toHaveAttribute("data-state", "visible");
    // The resting label remains the accessible name while the visible group is hidden.
    expect(screen.getByRole("button", { name: "Deploy" })).toBe(button);

    await act(async () => resolveAction!());

    expect(button).toHaveAttribute("data-status", "success");
    expect(group).toHaveAttribute("data-state", "visible");
    expect(pendingIcon).toHaveAttribute("data-state", "hidden");
  });

  it("passes the button gap through the pending centering wrapper", () => {
    render(
      <ActionButton action={() => undefined} icon={<span>@</span>}>
        Copy
      </ActionButton>,
    );

    const content = screen
      .getByRole("button")
      .querySelector('[data-slot="action-button-content"]');

    expect(content).toHaveClass("gap-[inherit]");
    expect(content?.firstElementChild).toHaveClass("gap-[inherit]");
  });

  it("morphs the glyph without dragging the label through the swap", () => {
    render(
      <ActionButton action={() => new Promise(() => {})} icon={<span>@</span>}>
        Save
      </ActionButton>,
    );

    // Not by name: the stand-in glyph is real text, so it joins the accessible name.
    const button = screen.getByRole("button");
    // Two boxes keep custom loaders with different widths from sliding the label
    // when the glyph changes.
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
