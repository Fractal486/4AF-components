import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { DeleteButton } from "./delete-button";

afterEach(() => {
  vi.useRealTimers();
});

describe("DeleteButton", () => {
  it("keeps its original timeout across parent renders and calls the latest callback", () => {
    vi.useFakeTimers();
    const onArmedChange = vi.fn();
    function Parent({ revision }: { revision: number }) {
      return (
        <DeleteButton resetAfter={500} onArmedChange={(armed) => onArmedChange(revision, armed)}>
          Remove
        </DeleteButton>
      );
    }
    const { rerender } = render(<Parent revision={0} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(onArmedChange).toHaveBeenLastCalledWith(0, true);
    act(() => vi.advanceTimersByTime(200));
    rerender(<Parent revision={1} />);
    act(() => vi.advanceTimersByTime(200));
    rerender(<Parent revision={2} />);
    act(() => vi.advanceTimersByTime(100));

    expect(button).not.toHaveAttribute("data-armed");
    expect(onArmedChange).toHaveBeenLastCalledWith(2, false);
    expect(onArmedChange).toHaveBeenCalledTimes(2);
  });

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

  it("requires releasing and pressing Enter again to confirm", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const now = vi.spyOn(Date, "now");
    try {
      now.mockReturnValue(1000);
      render(<DeleteButton onDelete={onDelete} />);
      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter>}");
      expect(button).toHaveAttribute("data-armed");
      now.mockReturnValue(1600);
      expect(fireEvent.keyDown(button, { key: "Enter", repeat: true })).toBe(false);
      expect(onDelete).not.toHaveBeenCalled();
      await user.keyboard("{/Enter}{Enter}");
      expect(onDelete).toHaveBeenCalledOnce();
    } finally {
      now.mockRestore();
    }
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
      ["xs", "gap-2"],
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
