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

  it("renders an optional decorative leading icon and steps the text aside", () => {
    render(
      <Input
        aria-label="Search"
        startIcon={<svg data-testid="search-glyph" />}
        placeholder="Search"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Search" });
    expect(input).toHaveAttribute("data-icon-start", "true");
    expect(input.className).toContain("data-[icon-start]:ps-9");

    const icon = screen.getByTestId("search-glyph").parentElement;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    // The glyph must never swallow the click that focuses the field.
    expect(icon?.className).toContain("pointer-events-none");
  });

  it("pulls the leading icon flush on the underline variant", () => {
    render(<Input aria-label="Title" variant="underline" startIcon={<svg data-testid="glyph" />} />);

    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input.className).toContain("data-[icon-start]:ps-6");
    expect(screen.getByTestId("glyph").parentElement?.className).toContain("start-0");
  });

  it("omits the icon slot and the wrapper entirely when no icon is given", () => {
    const { container } = render(<Input aria-label="Name" />);

    expect(container.querySelector("[data-slot=input-icon]")).toBeNull();
    expect(container.querySelector("[data-slot=input-wrapper]")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Name" })).not.toHaveAttribute("data-icon-start");
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

  it("composes a leading icon with the number steppers in one wrapper", () => {
    const { container } = render(
      <Input aria-label="Amount" type="number" startIcon={<svg data-testid="glyph" />} />,
    );

    const wrapper = container.querySelector("[data-slot=input-wrapper]");
    expect(wrapper).toHaveAttribute("data-icon-start", "true");
    expect(wrapper).toHaveAttribute("data-number-stepper", "true");
    expect(wrapper).toContainElement(screen.getByTestId("glyph"));
    expect(screen.getByRole("button", { name: "Increase value" })).toBeInTheDocument();
  });
});
