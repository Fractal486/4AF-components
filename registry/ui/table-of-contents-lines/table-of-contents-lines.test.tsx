import { act, fireEvent, render, screen } from "@testing-library/react";
import type { RefObject } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TableOfContentsLines } from "./table-of-contents-lines";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TableOfContentsLines", () => {
  it("renders a three-rule item and keeps a clicked heading active through scroll settling", () => {
    const root = document.createElement("div");
    const firstHeading = document.createElement("h2");
    const lastHeading = document.createElement("h2");
    firstHeading.id = "first-line";
    lastHeading.id = "last-line";
    root.append(firstHeading, lastHeading);
    document.body.append(root);

    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    vi.spyOn(firstHeading, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    vi.spyOn(lastHeading, "getBoundingClientRect").mockReturnValue({ top: 320 } as DOMRect);
    const scrollIntoView = vi.fn();
    Object.defineProperty(lastHeading, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    const rootRef = { current: root } as RefObject<HTMLElement | null>;
    const { container } = render(
      <TableOfContentsLines
        rootRef={rootRef}
        items={[
          { id: firstHeading.id, title: "First section" },
          { id: lastHeading.id, title: "Last section", level: 3 },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Table of contents" })).toHaveAttribute(
      "data-variant",
      "lines",
    );
    expect(screen.getByRole("link", { name: "First section" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(container.querySelectorAll("[data-toc-id]")).toHaveLength(2);
    const firstRules = screen
      .getByRole("link", { name: "First section" })
      .querySelector("[aria-hidden]");
    expect(firstRules?.children).toHaveLength(3);
    expect(firstRules?.firstElementChild).toHaveClass("group-hover:scale-x-[1.25]");

    fireEvent.click(screen.getByRole("link", { name: "Last section" }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(screen.getByRole("link", { name: "Last section" })).toHaveAttribute(
      "aria-current",
      "location",
    );

    act(() => root.dispatchEvent(new Event("scrollend")));
    expect(screen.getByRole("link", { name: "Last section" })).toHaveAttribute(
      "aria-current",
      "location",
    );

    root.remove();
  });
});

