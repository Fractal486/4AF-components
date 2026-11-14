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
          { id: firstHeading.id, title: "First section", level: 3 },
          { id: lastHeading.id, title: "Last section", level: 2 },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Table of contents" })).toHaveAttribute(
      "data-variant",
      "lines",
    );
    expect(screen.getByRole("navigation", { name: "Table of contents" })).toHaveClass(
      "overflow-y-auto",
      "overscroll-y-contain",
      "[overflow-anchor:none]",
      "[scrollbar-width:none]",
    );
    expect(screen.getByRole("navigation", { name: "Table of contents" })).not.toHaveAttribute(
      "data-density",
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
    expect(firstRules?.firstElementChild).toHaveClass(
      "group-hover:[clip-path:inset(0_0_0_0)]",
      "group-data-[active=true]:[clip-path:inset(0_0_0_0)]",
    );
    expect(
      screen.getByRole("link", { name: "First section" }).querySelector(":scope > span:last-child"),
    ).toHaveClass("group-data-[active=true]:translate-x-1");
    expect(screen.getByRole("link", { name: "First section" })).toHaveAttribute("data-active", "true");
    expect(firstRules?.children[1]).toHaveStyle({ transform: "translateX(-0.75rem)" });
    const lastRules = screen
      .getByRole("link", { name: "Last section" })
      .querySelector("[aria-hidden]");
    expect(lastRules?.children).toHaveLength(1);

    fireEvent.click(screen.getByRole("link", { name: "Last section" }));
    expect(screen.getByRole("link", { name: "First section" })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: "Last section" })).toHaveAttribute("data-active", "true");
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

  it("highlights a pinned activeId with no headings on the page", () => {
    render(<TableOfContentsLines items={[
      { id: "pinned-one", title: "One" },
      { id: "pinned-two", title: "Two" },
    ]} activeId="pinned-two" />);
    expect(screen.getByRole("link", { name: "Two" })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: "One" })).toHaveAttribute("data-active", "false");
  });

  it("withholds the labels until the list is pointed at, in the hover variant", () => {
    render(
      <TableOfContentsLines
        labels="hover"
        items={[
          { id: "first", title: "First section" },
          { id: "last", title: "Last section" },
        ]}
      />,
    );

    // The group is on the nav, not the row: one label appearing under the pointer while
    // the others stayed hidden would be a different component.
    expect(screen.getByRole("navigation", { name: "Table of contents" })).toHaveClass(
      "group/toc",
    );

    const label = screen
      .getByRole("link", { name: "First section" })
      .querySelector(":scope > span:last-child");
    expect(label).toHaveClass("opacity-0", "group-hover/toc:opacity-100");
    // Keyboard focus reaches it too — but a mouse press does not, or clicking an
    // entry would hold the list open after the pointer left. A touch screen never hovers.
    expect(label).toHaveClass(
      "group-has-[:focus-visible]/toc:opacity-100",
      "pointer-coarse:opacity-100",
    );
    // And a pointed-at row still nudges its label along with its own rule.
    expect(label).toHaveClass("group-hover/toc:group-hover:translate-x-1");
  });

});
