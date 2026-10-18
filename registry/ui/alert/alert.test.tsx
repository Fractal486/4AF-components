import { render, screen } from "@testing-library/react";
import { Alert } from "./alert";

describe("Alert", () => {
  it("renders nothing without a message", () => {
    const { container } = render(<Alert>{undefined}</Alert>);
    expect(container).toBeEmptyDOMElement();
  });

  it("interrupts for an error, and only for an error", () => {
    const { rerender } = render(<Alert>Enter a valid email address.</Alert>);

    // An error has just stopped the user; the rest are theirs to read at their leisure.
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address.");

    for (const variant of ["warning", "success", "info", "loading"] as const) {
      rerender(<Alert variant={variant}>Checked.</Alert>);

      expect(screen.getByRole("status")).toHaveTextContent("Checked.");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    }
  });

  it("publishes its variant and takes that status's ink", () => {
    const inks = {
      error: "text-destructive",
      warning: "text-warning-700",
      success: "text-success",
      // The two neutrals differ by weight, not hue, so this pair has to stay distinct.
      info: "text-foreground",
      loading: "text-muted-foreground",
    } as const;

    for (const [variant, ink] of Object.entries(inks)) {
      const { container, unmount } = render(
        <Alert variant={variant as keyof typeof inks}>Message</Alert>,
      );
      const message = container.firstElementChild;

      expect(message).toHaveAttribute("data-variant", variant);
      expect(message?.className).toContain(ink);
      unmount();
    }
  });

  it("shows the classic spinner for the loading line, without announcing it twice", () => {
    const { container } = render(<Alert variant="loading">Checking…</Alert>);

    // The message is already the announcement, so the loader must stay out of the
    // accessibility tree rather than adding a live region of its own.
    const loader = container.querySelector('[data-slot="classic-loader"]');
    expect(loader).toHaveAttribute("aria-hidden", "true");
    expect(loader?.querySelector("svg")).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("swaps the glyph with the variant, in the same slot", () => {
    const { rerender, container } = render(<Alert>Invalid</Alert>);
    const errorGlyph = container.querySelector("svg");

    rerender(<Alert variant="warning">Unverified</Alert>);
    const warningGlyph = container.querySelector("svg");

    expect(errorGlyph?.innerHTML).not.toEqual(warningGlyph?.innerHTML);
    // Lucide adds its own classes, so the shared part is the slot's size, not the whole
    // attribute — both glyphs still have to occupy the same 14px square.
    expect(errorGlyph?.getAttribute("class")).toContain("size-3.5");
    expect(warningGlyph?.getAttribute("class")).toContain("size-3.5");
    expect(warningGlyph).toHaveAttribute("aria-hidden", "true");
  });

  it("still answers to its old name", async () => {
    const { FieldError } = await import("./alert");

    render(<FieldError variant="success">Saved.</FieldError>);

    expect(screen.getByRole("status")).toHaveTextContent("Saved.");
  });
});
