import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select-motion";

function FruitOptions() {
  return (
    <SelectContent>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
      <SelectItem value="mango">Mango</SelectItem>
    </SelectContent>
  );
}

describe("Motion Select", () => {
  it("supports checkbox multi-select without closing the panel", () => {
    const onValueChange = vi.fn();

    render(
      <Select multiple defaultValue={["banana"]} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Pick fruits" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    const trigger = screen.getByRole("button", { name: "1 selected" });
    fireEvent.click(trigger);

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");

    const apple = screen.getByRole("option", { name: "Apple" });
    fireEvent.click(apple);

    expect(onValueChange).toHaveBeenLastCalledWith(["banana", "apple"]);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(apple).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "2 selected" })).toBeInTheDocument();
  });

  it("keeps the original single-select close-on-choice behaviour", () => {
    render(
      <Select defaultValue="banana">
        <SelectTrigger>
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    const trigger = screen.getByRole("button", { name: "Banana" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "Apple" }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Apple" })).toBeInTheDocument();
  });

  it("highlights a row while the pointer is over it", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pick a fruit" }));
    const apple = screen.getByRole("option", { name: "Apple" });

    fireEvent.pointerEnter(apple);
    expect(apple).toHaveAttribute("data-highlighted", "");

    fireEvent.pointerLeave(apple);
    expect(apple).not.toHaveAttribute("data-highlighted");
  });
});
