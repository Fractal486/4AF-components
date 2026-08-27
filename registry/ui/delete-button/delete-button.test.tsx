import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { DeleteButton } from "./delete-button";

afterEach(() => {
  vi.useRealTimers();
});

describe("DeleteButton", () => {
  it("requires a deliberate second press outside the double-click guard", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const onDelete = vi.fn();
    render(<DeleteButton onDelete={onDelete}>Remove</DeleteButton>);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(button).toHaveAttribute("data-armed", "true");
    fireEvent.click(button);
    expect(onDelete).not.toHaveBeenCalled();

    vi.advanceTimersByTime(351);
    fireEvent.click(button);
    expect(onDelete).toHaveBeenCalledOnce();
    expect(button).not.toHaveAttribute("data-armed");
  });

  it("disarms when its reset timer expires", () => {
    vi.useFakeTimers();
    render(<DeleteButton resetAfter={500}>Remove</DeleteButton>);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(button).toHaveAttribute("data-armed", "true");
    act(() => vi.advanceTimersByTime(500));
    expect(button).not.toHaveAttribute("data-armed");
  });

  it("uses the shared size-specific icon-label gap", () => {
    const { rerender } = render(<DeleteButton size="sm">Remove</DeleteButton>);
    const getContents = () =>
      Array.from(screen.getByRole("button").querySelectorAll('[data-slot="delete-button-content"]'));

    for (const [size, gap] of [
      ["sm", "gap-2"],
      ["md", "gap-2.5"],
      ["lg", "gap-3"],
    ] as const) {
      rerender(<DeleteButton size={size}>Remove</DeleteButton>);
      const contents = getContents();

      expect(contents).not.toHaveLength(0);
      for (const content of contents) expect(content).toHaveClass(gap);
    }
  });
});
