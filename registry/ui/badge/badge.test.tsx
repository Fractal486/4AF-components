import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("defaults to the small size", () => {
    render(
      <Badge data-testid="badge">
        Approved
      </Badge>,
    );

    expect(screen.getByTestId("badge")).toHaveClass("h-6", "px-2", "text-2xs");
  });
});
