import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "./input";

describe("Input", () => {
  it("renders a native input with the library state attributes", () => {
    render(<Input aria-label="Name" placeholder="Your name" />);

    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveAttribute("data-slot", "input");
    expect(input).toHaveAttribute("data-variant", "default");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(input.className).toContain("border-border");
    expect(input.className).not.toContain("ring-ring");
  });

  it("supports the plain variant and native input events", () => {
    const onChange = vi.fn();
    render(<Input aria-label="Search" variant="plain" onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: "Search" });
    expect(input.className).toContain("bg-transparent");
    fireEvent.change(input, { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("uses the shared 34px medium field geometry", () => {
    render(<Input aria-label="Name" />);

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveClass("h-[34px]", "rounded-[8px]");
  });

  it("supports an underline-only variant and a disabled cursor", () => {
    render(<Input aria-label="Title" variant="underline" disabled />);

    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input.className).toContain("border-b");
    expect(input.className).toContain("border-b-border");
    expect(input.className).toContain("cursor-not-allowed");
    expect(input).toBeDisabled();
  });

  it("adds accessible custom steppers for number inputs", () => {
    const onChange = vi.fn();
    render(
      <Input
        aria-label="Quantity"
        type="number"
        defaultValue="2"
        min="0"
        max="5"
        step="1"
        onChange={onChange}
      />,
    );

    const input = screen.getByRole("spinbutton", { name: "Quantity" });
    expect(input).toHaveAttribute("data-number-stepper", "true");
    expect(screen.getByRole("button", { name: "Increase value" })).toHaveClass("rounded-[6px]");
    expect(screen.getByRole("button", { name: "Decrease value" })).toHaveClass("rounded-[6px]");
    expect(screen.getByRole("button", { name: "Increase value" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Decrease value" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Increase value" }));
    expect(input).toHaveValue(3);
    expect(onChange).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Decrease value" }));
    expect(input).toHaveValue(2);
  });
});
