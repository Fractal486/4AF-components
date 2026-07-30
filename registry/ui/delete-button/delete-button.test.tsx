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
});
