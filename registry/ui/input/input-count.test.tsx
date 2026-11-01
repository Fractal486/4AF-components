import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Input, InputCount } from "./input";

describe("InputCount", () => {
  afterEach(() => vi.useRealTimers());

  it("reports near, limit, and over-limit states without enforcing the value", () => {
    const { rerender } = render(<InputCount length={35} maxLength={40} data-testid="count" />);
    const count = screen.getByTestId("count");
    expect(count).toHaveTextContent("35 / 40");
    expect(count).not.toHaveAttribute("data-state");
    rerender(<InputCount length={36} maxLength={40} data-testid="count" />);
    expect(count).toHaveAttribute("data-state", "near");
    rerender(<InputCount length={40} maxLength={40} data-testid="count" />);
    expect(count).toHaveAttribute("data-state", "limit");
    rerender(<InputCount length={45} maxLength={40} data-testid="count" />);
    expect(count).toHaveTextContent("45 / 40");
    expect(count).toHaveAttribute("data-state", "limit");
  });

  it("debounces announcements and clears them when leaving the threshold", () => {
    vi.useFakeTimers();
    const { rerender, unmount } = render(<InputCount length={0} maxLength={10} threshold={3} />);
    const live = screen.getByRole("status");
    act(() => vi.advanceTimersByTime(400));
    expect(live).toBeEmptyDOMElement();
    rerender(<InputCount length={7} maxLength={10} threshold={3} />);
    act(() => vi.advanceTimersByTime(200));
    rerender(<InputCount length={9} maxLength={10} threshold={3} />);
    act(() => vi.advanceTimersByTime(200));
    expect(live).toBeEmptyDOMElement();
    act(() => vi.advanceTimersByTime(200));
    expect(live).toHaveTextContent("1 character remaining");
    rerender(<InputCount length={10} maxLength={10} />);
    act(() => vi.advanceTimersByTime(400));
    expect(live).toHaveTextContent("Character limit reached");
    rerender(<InputCount length={12} maxLength={10} />);
    act(() => vi.advanceTimersByTime(400));
    expect(live).toHaveTextContent("2 characters over the limit");
    rerender(<InputCount length={0} maxLength={10} />);
    expect(live).toBeEmptyDOMElement();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("supports translated announcements, refs, and description linkage", () => {
    vi.useFakeTimers();
    const ref = createRef<HTMLSpanElement>();
    render(<>
      <Input aria-label="Name" aria-describedby="name-count" />
      <InputCount ref={ref} id="name-count" length={8} maxLength={10} threshold={2}
        className="custom" announcement={(remaining) => `${remaining} left`} />
    </>);
    expect(ref.current).toHaveAttribute("data-slot", "input-count");
    expect(ref.current).toHaveClass("custom");
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription("8 / 10");
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("status")).toHaveTextContent("2 left");
  });

  it("supports unlimited counts, zero limits, and a capped default threshold", () => {
    const { rerender } = render(<InputCount length={300} data-testid="count" />);
    const count = screen.getByTestId("count");
    expect(count).toHaveTextContent(/^300$/);
    expect(count).not.toHaveAttribute("data-state");
    rerender(<InputCount length={979} maxLength={1000} data-testid="count" />);
    expect(count).not.toHaveAttribute("data-state");
    rerender(<InputCount length={980} maxLength={1000} data-testid="count" />);
    expect(count).toHaveAttribute("data-state", "near");
    rerender(<InputCount length={0} maxLength={0} data-testid="count" />);
    expect(count).toHaveTextContent("0 / 0");
    expect(count).toHaveAttribute("data-state", "limit");
  });
});
