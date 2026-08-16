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
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("data-panel-active");
    expect(screen.getByRole("option", { name: "Banana" })).not.toHaveAttribute(
      "data-panel-active",
    );

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

  it("starts a normal select on its first option instead of the selected one", () => {
    render(
      <Select defaultValue="banana">
        <SelectTrigger>
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Banana" }));
    expect(screen.getByRole("option", { name: "Apple" })).toHaveFocus();
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

    const trigger = screen.getByRole("button", { name: "Pick a fruit" });
    fireEvent.click(trigger);
    const apple = screen.getByRole("option", { name: "Apple" });

    fireEvent.pointerEnter(apple);
    expect(apple).toHaveAttribute("data-highlighted", "");

    fireEvent.pointerLeave(apple);
    expect(apple).not.toHaveAttribute("data-highlighted");
  });

  it("renders an optional icon as an inert leading part", () => {
    render(
      <Select defaultValue="apple">
        <SelectTrigger>
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple" icon={<span data-testid="fruit-icon" />}>
            Apple
          </SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("button", { name: "Apple" });
    expect(trigger.querySelector('[data-testid="fruit-icon"]')).toBeInTheDocument();
    fireEvent.click(trigger);

    expect(trigger.querySelector('[data-testid="fruit-icon"]')?.parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("filters options from an optional plain panel search", () => {
    render(
      <Select defaultValue="banana">
        <SelectTrigger>
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent searchable searchPlaceholder="Search fruit">
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="mango">Mango</SelectItem>
        </SelectContent>
      </Select>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Banana" }));
    const input = screen.getByRole("textbox", { name: "Search options" });
    expect(input).toHaveAttribute("placeholder", "Search fruit");
    expect(input).toHaveFocus();
    expect(input).toHaveClass("h-full");
    expect(input).toHaveClass("p-0");
    expect(input.parentElement).toHaveClass("h-[38px]", "px-3.5");
    expect(input.parentElement?.querySelector("svg")).not.toBeInTheDocument();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    const apple = screen.getByRole("option", { name: "Apple" });
    const banana = screen.getByRole("option", { name: "Banana" });
    expect(apple).toHaveFocus();
    fireEvent.keyDown(apple, { key: "ArrowDown" });
    expect(banana).toHaveFocus();
    fireEvent.keyDown(banana, { key: "ArrowUp" });
    expect(apple).toHaveFocus();

    fireEvent.focus(input);

    fireEvent.change(input, { target: { value: "man" } });
    expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Mango" })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("shows a preselected value's icon and label without ever opening", () => {
    render(
      <Select defaultValue="apple">
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple" icon={<span data-testid="apple-icon" />}>
            Apple
          </SelectItem>
          <SelectItem value="mango" icon={<span data-testid="mango-icon" />}>
            Mango
          </SelectItem>
        </SelectContent>
      </Select>,
    );

    // This one needs no `items` mapping, and that is not an oversight: the panel is
    // inline and always mounted (it animates between show and hidden rather than being
    // conditionally rendered), so items register their icons and labels on the first
    // render. Make the panel conditional and this breaks — which is what this pins.
    // The aria-label is the accessible name; the label text is the trigger's content.
    const trigger = screen.getByRole("button", { name: "Fruit" });
    expect(trigger.querySelector('[data-testid="apple-icon"]')).toBeInTheDocument();
    expect(trigger).toHaveTextContent("Apple");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
