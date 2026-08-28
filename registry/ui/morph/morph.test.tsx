import { render, screen } from "@testing-library/react";
import { Morph } from "./morph";

describe("Morph", () => {
  it("does not render a duplicate sizer for a single state", () => {
    const { container } = render(
      <Morph activeKey="idle" items={{ idle: <span>Pending</span> }} />,
    );

    expect(screen.getAllByText("Pending")).toHaveLength(1);
    expect(container.querySelector('[data-slot="morph"] [aria-hidden="true"]')).not.toBeInTheDocument();
  });
});
