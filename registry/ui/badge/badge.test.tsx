import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("defaults to the small size", () => {
    render(
      <Badge data-testid="badge">
        Approved
      </Badge>,
    );

    expect(screen.getByTestId("badge")).toHaveClass(
      "h-4",
      "rounded-[4px]",
      "px-1",
      "gap-1",
      "text-2xs",
    );
    expect(screen.getByTestId("badge").querySelectorAll('[data-slot="morph"]')).toHaveLength(2);
  });

  it.each([
    ["sm", "h-4", "rounded-[4px]", "gap-1"],
    ["md", "h-5", "rounded-[4px]", "gap-1.5"],
    ["lg", "h-6", "rounded-[6px]", "gap-2"],
  ] as const)("uses the %s boxed geometry", (size, height, radius, gap) => {
    render(
      <Badge data-testid="badge" size={size}>
        Approved
      </Badge>,
    );

    expect(screen.getByTestId("badge")).toHaveClass(height, radius, gap);
  });

  it("supports a pill shape alongside the current rounded shape", () => {
    render(
      <>
        <Badge data-testid="rounded">Rounded</Badge>
        <Badge data-testid="pill" shape="pill">
          Pill
        </Badge>
        <Badge data-testid="outline-pill" variant="outline" shape="pill">
          Outline pill
        </Badge>
      </>,
    );

    expect(screen.getByTestId("rounded")).toHaveClass("rounded-[4px]");
    expect(screen.getByTestId("rounded")).not.toHaveClass("rounded-full");
    expect(screen.getByTestId("pill")).toHaveClass("rounded-full");
    expect(screen.getByTestId("pill")).not.toHaveClass("rounded-[4px]");
    expect(screen.getByTestId("outline-pill")).toHaveClass("rounded-full");
  });

  it("keeps plain unboxed, gives solid a status wash, and keeps outline gray", () => {
    render(
      <>
        <Badge data-testid="plain" variant="plain" status="danger">
          Plain
        </Badge>
        <Badge data-testid="solid" variant="solid" status="success">
          Solid
        </Badge>
        <Badge data-testid="outline" variant="outline" status="danger">
          Outline
        </Badge>
      </>,
    );

    expect(screen.getByTestId("plain")).toHaveClass("text-destructive");
    expect(screen.getByTestId("plain")).not.toHaveClass("border", "bg-destructive/10");

    expect(screen.getByTestId("solid")).toHaveClass("text-success", "bg-success/10");
    expect(screen.getByTestId("solid")).not.toHaveClass("border");

    expect(screen.getByTestId("outline")).toHaveClass("text-destructive", "border-border-strong");
    expect(screen.getByTestId("outline")).not.toHaveClass("bg-destructive/10");
  });
});
