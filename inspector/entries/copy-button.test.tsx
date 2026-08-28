import { render, screen } from "@testing-library/react";
import { copyButtonEntry } from "./copy-button";

describe("CopyButton inspector", () => {
  it("applies the selected button size when the label is enabled", () => {
    expect(copyButtonEntry.controls.size.options).toEqual([
      "xs",
      "sm",
      "md",
      "lg",
    ]);

    render(
      copyButtonEntry.render({
        variant: "outline",
        size: "lg",
        withLabel: true,
        value: "hello",
        revertAfter: 2000,
        lazy: false,
      }),
    );

    const button = screen.getByRole("button", { name: "Copy command" });
    expect(button).toHaveAttribute("data-size", "lg");
    expect(button).toHaveClass("h-[38px]", "px-5");
  });

  it("keeps the selected size square when the label is disabled", () => {
    render(
      copyButtonEntry.render({
        variant: "outline",
        size: "lg",
        withLabel: false,
        value: "hello",
        revertAfter: 2000,
        lazy: false,
      }),
    );

    const button = screen.getByRole("button", { name: "Copy" });
    expect(button).toHaveAttribute("data-size", "icon-lg");
    expect(button).toHaveClass("size-[38px]");
  });
});
