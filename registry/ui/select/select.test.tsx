import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const FRUITS = {
  apple: "Apple",
  banana: "Banana",
  mango: "Mango",
} as const;

function FruitOptions() {
  return (
    <SelectContent>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
      <SelectItem value="mango">Mango</SelectItem>
    </SelectContent>
  );
}

describe("Base UI Select", () => {
  it("keeps the original single-select close-on-choice behaviour", async () => {
    const user = userEvent.setup();

    render(
      <Select items={FRUITS} defaultValue="banana">
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Apple" }));

    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(trigger).toHaveTextContent("Apple");
  });

  it("uses the same parts for checkbox multi-select without closing the panel", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select multiple items={FRUITS} defaultValue={["banana"]} onValueChange={onValueChange}>
        <SelectTrigger aria-label="Fruits">
          <SelectValue placeholder="Pick fruits" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruits" });
    expect(trigger).toHaveTextContent("1 selected");
    await user.click(trigger);

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");

    const apple = screen.getByRole("option", { name: "Apple" });
    await user.click(apple);

    await waitFor(() =>
      expect(onValueChange).toHaveBeenLastCalledWith(["banana", "apple"], expect.anything()),
    );
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(apple).toHaveAttribute("aria-selected", "true");
    expect(trigger).toHaveTextContent("2 selected");

    const checkbox = apple.querySelector<HTMLElement>("[role=checkbox]");
    expect(checkbox).toHaveAttribute("aria-hidden", "true");
    expect(checkbox).toHaveAttribute("tabindex", "-1");
    expect(checkbox).toHaveAttribute("aria-checked", "true");
    expect(checkbox).toHaveAttribute("data-checked");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
