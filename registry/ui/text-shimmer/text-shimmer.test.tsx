import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type CSSProperties } from "react";
import { TextShimmer } from "./text-shimmer";

describe("TextShimmer", () => {
  it("keeps one accessible label and the overlay when callers add text and overflow classes", () => {
    render(
      <TextShimmer as="p" duration={4} className="text-muted-foreground overflow-hidden">
        Syncing changes…
      </TextShimmer>,
    );

    const label = screen.getByText("Syncing changes…");
    expect(label.tagName).toBe("P");
    expect(label).toHaveClass(
      "shimmer-text", "animate-text-shimmer", "max-w-full", "overflow-hidden",
      "text-ellipsis", "whitespace-nowrap", "text-muted-foreground",
    );
    expect(label).not.toHaveClass("text-transparent", "bg-clip-text");
    expect(label.style.getPropertyValue("--text-shimmer-duration")).toBe("4s");
  });

  it("forwards anchor attributes, events and refs to the chosen element", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLAnchorElement>();
    const clicked = vi.fn();
    render(
      <TextShimmer as="a" href="#results" ref={ref} id="result-link" aria-label="Open results"
        onClick={(event) => { event.preventDefault(); clicked(event.currentTarget.href); }}>
        Results ready
      </TextShimmer>,
    );
    const link = screen.getByRole("link", { name: "Open results" });
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute("id", "result-link");
    await user.click(link);
    expect(clicked).toHaveBeenCalledWith(expect.stringContaining("#results"));
  });

  it("updates playback without replacing the element or losing focus", () => {
    const { rerender } = render(<TextShimmer role="status" tabIndex={0}>Syncing</TextShimmer>);
    const label = screen.getByRole("status");
    label.focus();
    expect(label).toHaveAttribute("data-active", "true");
    expect(label).not.toHaveAttribute("data-once");
    rerender(<TextShimmer active={false} once role="status" tabIndex={0}>Synced</TextShimmer>);
    expect(screen.getByRole("status")).toBe(label);
    expect(label).toHaveFocus();
    expect(label).toHaveAttribute("data-active", "false");
    expect(label).toHaveAttribute("data-once");
    expect(label).not.toHaveAttribute("active");
    expect(label).not.toHaveAttribute("once");
    expect(label).toHaveTextContent("Synced");
  });

  it("merges caller styles and lets them override CSS variables", () => {
    render(<TextShimmer duration={3} style={{ color: "rebeccapurple", "--text-shimmer-spread": "2ch", "--text-shimmer-duration": "4s" } as CSSProperties}>Working</TextShimmer>);
    const label = screen.getByText("Working");
    expect(getComputedStyle(label).color).toBe("rgb(102, 51, 153)");
    expect(label.style.getPropertyValue("--text-shimmer-spread")).toBe("2ch");
    expect(label.style.getPropertyValue("--text-shimmer-duration")).toBe("4s");
  });

  it.each([0, -1, NaN, Infinity])("uses a valid cycle for invalid duration %s", (duration) => {
    render(<TextShimmer duration={duration}>Working</TextShimmer>);
    expect(screen.getByText("Working").style.getPropertyValue("--text-shimmer-duration")).toBe("2.5s");
  });
});
