import { act, render } from "@testing-library/react";
import { AsciiLoader } from "./ascii-loader";

describe("AsciiLoader", () => {
  it("runs its timer only while visible and removes the hidden status", () => {
    vi.useFakeTimers();
    const start = vi.spyOn(globalThis, "setInterval");
    const stop = vi.spyOn(globalThis, "clearInterval");
    const { container, queryByRole, rerender, unmount } = render(<AsciiLoader loading={false} label="Working" />);
    try {
      expect(container).toBeEmptyDOMElement();
      expect(start).not.toHaveBeenCalled();
      rerender(<AsciiLoader loading label="Working" />);
      expect(queryByRole("status", { name: "Working" })).toBeInTheDocument();
      expect(start).toHaveBeenCalledTimes(1);
      const firstFrame = container.textContent;
      act(() => { vi.advanceTimersByTime(80); });
      expect(container.textContent).not.toBe(firstFrame);
      rerender(<AsciiLoader loading={false} label="Working" />);
      expect(container).toBeEmptyDOMElement();
      expect(queryByRole("status")).not.toBeInTheDocument();
      expect(stop).toHaveBeenCalledWith(start.mock.results[0]!.value);
      act(() => { vi.advanceTimersByTime(800); });
      expect(start).toHaveBeenCalledTimes(1);
      rerender(<AsciiLoader label="Working" />);
      expect(queryByRole("status", { name: "Working" })).toBeInTheDocument();
      expect(start).toHaveBeenCalledTimes(2);
      unmount();
      expect(stop).toHaveBeenCalledWith(start.mock.results[1]!.value);
    } finally {
      unmount();
      start.mockRestore();
      stop.mockRestore();
      vi.useRealTimers();
    }
  });
});
