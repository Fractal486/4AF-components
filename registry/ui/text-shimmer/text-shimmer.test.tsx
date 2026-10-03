import { render, screen } from "@testing-library/react";
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
});
