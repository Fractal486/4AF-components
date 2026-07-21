import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("uses Base UI's safe non-submit default", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });

  it("supports a plain variant with no background in either state", () => {
    render(<Button variant="plain">Text only</Button>);

    const button = screen.getByRole("button", { name: "Text only" });
    expect(button.className).toContain("bg-transparent");
    expect(button.className).toContain("hover:bg-transparent");
  });

  it("keeps the child link and its semantics with asChild", () => {
    const onClick = vi.fn();
    render(
      <Button asChild variant="primary">
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
    expect(link).toHaveAttribute("data-variant", "primary");
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("can disable press scaling for an asChild trigger", () => {
    render(
      <Button asChild pressScale={false}>
        <a href="/docs">Static trigger</a>
      </Button>,
    );

    expect(screen.getByRole("link", { name: "Static trigger" }).className).not.toContain(
      "active:scale-[0.95]",
    );
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
