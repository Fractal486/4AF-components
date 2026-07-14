import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("uses Base UI's safe non-submit default", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });

  it("keeps the child link and its semantics with asChild", () => {
    const onClick = vi.fn();
    render(
      <Button asChild variant="brand">
        <a
          href="/docs"
          onClick={(event) => {
            event.preventDefault();
            onClick();
          }}
        >
          Read docs
        </a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Read docs" });
    expect(link).toHaveAttribute("href", "/docs");
    expect(link).toHaveAttribute("data-variant", "brand");
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps a loading asChild link styled and blocks its interaction", () => {
    const onClick = vi.fn();
    render(
      <Button asChild loading>
        <a href="/deploy" onClick={onClick}>
          Deploy
        </a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Loading" });
    const click = createEvent.click(link);
    fireEvent(link, click);

    expect(link).toHaveAttribute("data-loading", "true");
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link.className).toContain("bg-primary");
    expect(click.defaultPrevented).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });
});
