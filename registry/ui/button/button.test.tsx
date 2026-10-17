import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { act, Suspense, type ReactElement } from "react";
import { vi } from "vitest";
import { Button } from "./button";

/** The shape React's RSC client hands a client component for a child it hasn't resolved. */
function lazyChild(element: ReactElement) {
  return {
    $$typeof: Symbol.for("react.lazy"),
    _payload: Promise.resolve(element),
    _init: (payload: unknown) => payload,
  } as unknown as ReactElement;
}

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

  it("uses the revised text and icon-control heights", () => {
    render(
      <>
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="icon-xs" aria-label="Extra small icon">
          XS
        </Button>
        <Button size="icon-sm" aria-label="Small icon">
          S
        </Button>
        <Button size="icon" aria-label="Medium icon">
          M
        </Button>
        <Button size="icon-lg" aria-label="Large icon">
          L
        </Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Extra small" })).toHaveClass("h-6", "rounded-[6px]");
    expect(screen.getByRole("button", { name: "Small" })).toHaveClass("h-[30px]", "rounded-[6px]");
    expect(screen.getByRole("button", { name: "Medium" })).toHaveClass("h-[34px]", "rounded-[8px]");
    expect(screen.getByRole("button", { name: "Large" })).toHaveClass("h-[38px]", "rounded-[8px]");
    expect(screen.getByRole("button", { name: "Extra small icon" })).toHaveClass("size-6", "rounded-[6px]");
    expect(screen.getByRole("button", { name: "Small icon" })).toHaveClass("size-[30px]", "rounded-[6px]");
    expect(screen.getByRole("button", { name: "Medium icon" })).toHaveClass("size-[34px]", "rounded-[8px]");
    expect(screen.getByRole("button", { name: "Large icon" })).toHaveClass("size-[38px]", "rounded-[8px]");
  });

  it("rounds a pill fully, replacing the radius its size gives it", () => {
    render(
      <>
        <Button>Rectangular</Button>
        <Button shape="pill">Pill</Button>
      </>,
    );

    const rectangular = screen.getByRole("button", { name: "Rectangular" });
    const pill = screen.getByRole("button", { name: "Pill" });
    expect(rectangular).toHaveAttribute("data-shape", "rectangular");
    expect(rectangular).toHaveClass("rounded-[8px]");
    expect(pill).toHaveAttribute("data-shape", "pill");
    expect(pill).toHaveClass("rounded-full");
    expect(pill).not.toHaveClass("rounded-[8px]");
  });

  it("sizes the loader slot to the button's icons", () => {
    render(
      <>
        <Button loading size="sm">Small</Button>
        <Button loading>Medium</Button>
      </>,
    );

    const [small, medium] = screen.getAllByRole("button");
    expect(small).toHaveClass("[&_[data-slot=loader]]:size-3.5", "[&_svg]:size-3.5");
    expect(medium).toHaveClass("[&_[data-slot=loader]]:size-4", "[&_svg]:size-4");
    expect(medium!.querySelector('[data-slot="loader"]')).toBeInTheDocument();
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

  it("moves the press onto a content wrapper instead of the box", () => {
    render(<Button pressTarget="content">Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.querySelector("[data-slot=button-content]")).not.toBeNull();
  });

  it("presses the box itself by default, with no extra wrapper", () => {
    render(<Button>Save</Button>);

    expect(
      screen.getByRole("button", { name: "Save" }).querySelector("[data-slot=button-content]"),
    ).toBeNull();
  });

  it("scales the content of an asChild link rather than the link", () => {
    render(
      <Button asChild pressTarget="content">
        <a href="/docs">Read docs</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Read docs" });
    expect(link.className).not.toContain("active:scale-[0.95]");
    expect(link.className).toContain("[&:active_[data-slot=button-content]]:scale-[0.95]");
  });

  it("accepts an asChild link that arrives as a lazy server reference", async () => {
    await act(async () => {
      render(
        <Suspense>
          <Button asChild>{lazyChild(<a href="/docs">Browse</a>)}</Button>
        </Suspense>,
      );
    });

    const link = await screen.findByRole("link", { name: "Browse" });
    expect(link).toHaveAttribute("data-variant", "primary");
  });
});
