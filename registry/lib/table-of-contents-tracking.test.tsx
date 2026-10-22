import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { TableOfContents } from "../ui/table-of-contents/table-of-contents";
import { TableOfContentsLines } from "../ui/table-of-contents-lines/table-of-contents-lines";

describe.each([
  ["TableOfContents", TableOfContents],
  ["TableOfContentsLines", TableOfContentsLines],
] as const)("%s link activation", (_, Component) => {
  function setup() {
    render(
      <>
        <h2 id="target-heading">Target heading</h2>
        <Component items={[{ id: "target-heading", title: "Target" }]} />
      </>,
    );
    const scrollIntoView = vi.fn();
    Object.assign(screen.getByRole("heading"), { scrollIntoView });
    return { link: screen.getByRole("link", { name: "Target" }), scrollIntoView };
  }

  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
  ])("preserves native navigation for %j", (options) => {
    const { link, scrollIntoView } = setup();
    const click = createEvent.click(link, options);
    fireEvent(link, click);

    expect(link).toHaveAttribute("href", "#target-heading");
    expect(click.defaultPrevented).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("still intercepts an ordinary click for smooth scrolling", () => {
    const { link, scrollIntoView } = setup();
    const click = createEvent.click(link, { button: 0 });
    fireEvent(link, click);

    expect(click.defaultPrevented).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: "smooth", block: "start" });
  });
});
