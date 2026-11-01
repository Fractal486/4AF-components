import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Separator } from "./separator";

describe("Separator", () => {
  it("keeps label content readable and restores separator semantics when removed", () => {
    const { rerender } = render(<Separator label="Or" data-testid="divider" />);
    const separator = screen.getByTestId("divider");
    expect(separator).toHaveAttribute("data-labeled");
    expect(separator).not.toHaveAttribute("role");
    expect(separator).not.toHaveAttribute("aria-orientation");
    expect(screen.getByText("Or")).toBeVisible();
    rerender(<Separator label="" data-testid="divider" />);
    expect(screen.getByRole("separator")).toBe(separator);
    expect(separator).not.toHaveAttribute("data-labeled");
    expect(separator).not.toHaveAccessibleName();
    expect(separator).toBeEmptyDOMElement();
  });

  it("supports vertical dividers and forwards the ref and accessible name", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Separator ref={ref} orientation="vertical" aria-label="Other options" />);
    const separator = screen.getByRole("separator", { name: "Other options" });
    expect(ref.current).toBe(separator);
    expect(separator).toHaveAttribute("data-orientation", "vertical");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
  });

  it("accepts rich labels and children while giving label precedence", () => {
    const { rerender } = render(<Separator><strong>Today</strong><a href="/archive">Archive</a></Separator>);
    expect(screen.getByRole("link", { name: "Archive" })).toBeVisible();
    expect(screen.queryByRole("separator")).toBeNull();
    rerender(<Separator label={<strong>Tomorrow</strong>}>Today</Separator>);
    expect(screen.getByText("Tomorrow").tagName).toBe("STRONG");
    expect(screen.queryByText("Today")).toBeNull();
    rerender(<Separator label={0} />);
    expect(screen.getByText("0")).toBeVisible();
    rerender(<Separator label={<> {false}{null}<></></>} />);
    expect(screen.getByRole("separator")).not.toHaveAttribute("data-labeled");
  });

  it("makes plain lines decorative without hiding labeled content", () => {
    const { rerender } = render(<Separator decorative data-testid="divider" />);
    const divider = screen.getByTestId("divider");
    expect(divider).toHaveAttribute("role", "none");
    expect(divider).not.toHaveAttribute("aria-orientation");
    expect(screen.queryByRole("separator")).toBeNull();
    rerender(<Separator decorative label={<a href="/archive">Archive</a>} data-testid="divider" />);
    expect(divider).not.toHaveAttribute("role");
    expect(screen.getByRole("link", { name: "Archive" })).toBeVisible();
  });

  it("merges state-dependent classes, updates alignment and preserves element substitution", () => {
    const className = vi.fn(({ orientation }: { orientation: string }) => `custom-${orientation}`);
    const { rerender } = render(<Separator label="Today" align="start" className={className} render={<span />} data-testid="divider" />);
    const divider = screen.getByTestId("divider");
    expect(divider.tagName).toBe("SPAN");
    expect(divider).toHaveAttribute("data-align", "start");
    expect(divider).toHaveClass("group/separator", "custom-horizontal");
    expect(className).toHaveBeenCalledWith({ orientation: "horizontal" });
    rerender(<Separator orientation="vertical" label="Today" align="end" className={className} render={<span />} data-testid="divider" />);
    expect(divider).toHaveAttribute("data-align", "end");
    expect(divider).toHaveClass("custom-vertical");
    expect(divider).not.toHaveClass("custom-horizontal");
  });
});
