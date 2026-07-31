import { render, screen } from "@testing-library/react";
import { Button } from "@/registry/ui/button/button";
import { ButtonGroup } from "./button-group";

describe("ButtonGroup", () => {
  it("flattens only the joined side of each button", () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>,
    );

    const [first, middle, last] = screen.getAllByRole("button");
    expect(first?.className).toContain("rounded-e-none");
    expect(first?.className).not.toContain("rounded-s-none");
    expect(middle?.className).toContain("rounded-none");
    expect(last?.className).toContain("rounded-s-none");
    expect(last?.className).not.toContain("rounded-e-none");
  });

  it("flattens buttons nested inside fragments", () => {
    render(
      <ButtonGroup>
        <>
          <Button>One</Button>
          <>
            <Button>Two</Button>
            {false && <Button>Hidden</Button>}
          </>
        </>
        <Button>Three</Button>
      </ButtonGroup>,
    );

    const [first, middle, last] = screen.getAllByRole("button");
    expect(first?.className).toContain("rounded-e-none");
    expect(middle?.className).toContain("rounded-none");
    expect(last?.className).toContain("rounded-s-none");
  });

  it("leaves a single button alone", () => {
    render(
      <ButtonGroup>
        <Button>Only</Button>
      </ButtonGroup>,
    );

    const button = screen.getByRole("button");
    expect(button.className).not.toContain("rounded-none");
    expect(button.className).not.toContain("border-s");
  });

  it("passes its variant and size down as defaults a child can still override", () => {
    render(
      <ButtonGroup variant="outline" size="sm">
        <Button>Inherits</Button>
        <Button variant="destructive">Own</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("button", { name: "Inherits" })).toHaveAttribute(
      "data-variant",
      "outline",
    );
    expect(screen.getByRole("button", { name: "Inherits" })).toHaveAttribute("data-size", "sm");
    expect(screen.getByRole("button", { name: "Own" })).toHaveAttribute(
      "data-variant",
      "destructive",
    );
  });

  it("draws the outline once, on the group, and drops it on the buttons", () => {
    const { container } = render(
      <ButtonGroup variant="outline">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );

    const group = container.querySelector("[data-slot=button-group]");
    expect(group?.className).toContain("shadow-border");
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("shadow-none");
    }
  });

  it("frames a run whose outline comes from the buttons rather than the group", () => {
    const { container } = render(
      <ButtonGroup>
        <Button variant="outline">One</Button>
        <Button variant="outline">Two</Button>
      </ButtonGroup>,
    );

    expect(container.querySelector("[data-slot=button-group]")?.className).toContain(
      "shadow-border",
    );
  });

  it("draws no seam between quiet buttons, and one against a fill", () => {
    const { rerender } = render(
      <ButtonGroup variant="ghost">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );

    expect(screen.getAllByRole("button")[1]?.className).not.toContain("border-s");

    rerender(
      <ButtonGroup variant="primary">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );

    expect(screen.getAllByRole("button")[1]?.className).toContain("border-s");
  });

  it("moves the press to the label, so no seam opens while a button is held", () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );

    for (const button of screen.getAllByRole("button")) {
      expect(button.querySelector("[data-slot=button-content]")).not.toBeNull();
    }
  });

  it("hands a non-Button child the classes and none of the props", () => {
    render(
      <ButtonGroup variant="outline">
        <Button>One</Button>
        <a href="/docs">Docs</a>
      </ButtonGroup>,
    );

    const link = screen.getByRole("link", { name: "Docs" });
    expect(link.className).toContain("rounded-s-none");
    // `pressTarget` on an anchor would reach the DOM as an unknown attribute.
    expect(link).not.toHaveAttribute("pressTarget");
  });
});
