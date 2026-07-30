import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { RefObject } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TableOfContents } from "./table-of-contents";

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TableOfContents", () => {
  it("keeps the current section highlighted while prose sits between headings", async () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

    const root = document.createElement("div");
    const firstHeading = document.createElement("h2");
    const secondHeading = document.createElement("h2");
    firstHeading.id = "first-section";
    secondHeading.id = "second-section";
    root.append(firstHeading, secondHeading);
    document.body.append(root);

    const firstTop = -120;
    const secondTop = 320;
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    vi.spyOn(firstHeading, "getBoundingClientRect").mockImplementation(
      () => ({ top: firstTop }) as DOMRect,
    );
    vi.spyOn(secondHeading, "getBoundingClientRect").mockImplementation(
      () => ({ top: secondTop }) as DOMRect,
    );

    const rootRef = { current: root } as RefObject<HTMLElement | null>;
    const { container } = render(
      <TableOfContents
        rootRef={rootRef}
        items={[
          { id: firstHeading.id, title: "First section" },
          { id: secondHeading.id, title: "Second section" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "First section" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(screen.getByRole("link", { name: "Second section" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(container.querySelectorAll("svg path")[1]).toHaveStyle({ opacity: "1" });

    root.scrollTop = 620;
    fireEvent.scroll(root);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Second section" })).toHaveAttribute(
        "aria-current",
        "location",
      ),
    );
    expect(screen.getByRole("link", { name: "First section" })).not.toHaveAttribute("aria-current");
    expect(container.querySelectorAll("svg path")[1]).toHaveStyle({ opacity: "1" });

    root.remove();
  });
});
