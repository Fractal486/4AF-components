import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "./empty";

const parts = [Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent]
  .map((Part) => ({ name: Part.name, Part }));

describe("Empty", () => {
  it("keeps the default layout and lets callers change size and opt out of entry motion", () => {
    const { rerender } = render(<Empty data-testid="empty"><EmptyTitle>Nothing yet</EmptyTitle></Empty>);
    const root = screen.getByTestId("empty");
    expect(root).toHaveAttribute("data-size", "md");
    expect(root).toHaveAttribute("data-animated");
    rerender(<Empty size="sm" animated={false} data-testid="empty"><EmptyTitle>Nothing yet</EmptyTitle></Empty>);
    expect(screen.getByTestId("empty")).toBe(root);
    expect(root).toHaveAttribute("data-size", "sm");
    expect(root).not.toHaveAttribute("data-animated");
    expect(root).not.toHaveAttribute("size");
    expect(root).not.toHaveAttribute("animated");
  });

  it.each(parts)("$name merges custom element props and forwards both refs without a wrapper", async ({ Part }) => {
    const user = userEvent.setup();
    const outerRef = createRef<HTMLDivElement>();
    const elementRef = createRef<HTMLButtonElement>();
    const outerClick = vi.fn();
    const elementClick = vi.fn();
    const { container } = render(
      <Part ref={outerRef} className="caller" onClick={outerClick} title="Details"
        render={<button ref={elementRef} type="button" className="element" onClick={elementClick} />}>
        Continue
      </Part>,
    );
    const button = screen.getByRole("button", { name: "Continue" });
    expect(container.firstElementChild).toBe(button);
    expect(outerRef.current).toBe(button);
    expect(elementRef.current).toBe(button);
    expect(button).toHaveClass("caller", "element");
    expect(button).toHaveAttribute("data-slot");
    expect(button).toHaveAttribute("title", "Details");
    await user.click(button);
    expect(outerClick).toHaveBeenCalledOnce();
    expect(elementClick).toHaveBeenCalledOnce();
  });

  it.each(parts)("$name supports asChild with the child's props, content, and ref intact", ({ Part }) => {
    const outerRef = createRef<HTMLDivElement>();
    const childRef = createRef<HTMLHeadingElement>();
    const { container } = render(
      <Part asChild ref={outerRef} className="caller" render={<aside />}>
        <h3 ref={childRef} id="title" className="child">No results</h3>
      </Part>,
    );
    const heading = screen.getByRole("heading", { level: 3, name: "No results" });
    expect(container.firstElementChild).toBe(heading);
    expect(outerRef.current).toBe(heading);
    expect(childRef.current).toBe(heading);
    expect(heading).toHaveClass("caller", "child");
    expect(heading).toHaveAttribute("data-slot");
    expect(heading).not.toHaveAttribute("asChild");
  });

  it("supports render functions and a named region with a semantic title", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Empty ref={ref} render={(props) => <section {...props} />} aria-labelledby="empty-title">
        <EmptyHeader render={<header />}>
          <EmptyTitle id="empty-title" render={<h2 />}>No projects</EmptyTitle>
          <EmptyDescription render={<p />}>Create your first project.</EmptyDescription>
        </EmptyHeader>
      </Empty>,
    );
    expect(screen.getByRole("region", { name: "No projects" })).toBe(ref.current);
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("data-slot", "empty-title");
    expect(screen.getByText("Create your first project.").tagName).toBe("P");
  });
});
