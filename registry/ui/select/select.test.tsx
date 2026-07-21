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
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    await user.click(screen.getByRole("option", { name: "Apple" }));

    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(trigger).toHaveTextContent("Apple");
  });

  it("starts a normal select on its first option instead of the selected one", async () => {
    const user = userEvent.setup();

    render(
      <Select items={FRUITS} defaultValue="banana">
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    await waitFor(() => expect(screen.getByRole("option", { name: "Apple" })).toHaveFocus());
  });

  it("runs a consumer focus handler without losing the active-row synchronization", async () => {
    const user = userEvent.setup();
    const onFocusCapture = vi.fn();

    render(
      <Select items={FRUITS}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana" onFocusCapture={onFocusCapture}>
            Banana
          </SelectItem>
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    const banana = await screen.findByRole("option", { name: "Banana" });
    await user.keyboard("{ArrowDown}");

    await waitFor(() => expect(onFocusCapture).toHaveBeenCalled());
    await waitFor(() => expect(banana).toHaveAttribute("data-panel-active"));
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

  it("renders an optional icon as an inert leading part", async () => {
    const user = userEvent.setup();

    render(
      <Select
        items={{ apple: "Apple" }}
        defaultValue="apple"
        iconForValue={() => <span data-testid="fruit-icon" />}
      >
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple" icon={<span data-testid="fruit-icon" />}>
            Apple
          </SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger.querySelector('[data-testid="fruit-icon"]')).toBeInTheDocument();
    await user.click(trigger);

    expect(screen.getByRole("option", { name: "Apple" }).querySelector('[data-testid="fruit-icon"]')?.parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("filters options from an optional plain panel search", async () => {
    const user = userEvent.setup();

    render(
      <Select items={FRUITS} defaultValue="banana">
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent searchable searchPlaceholder="Search fruit">
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="mango">Mango</SelectItem>
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    const input = screen.getByRole("textbox", { name: "Search options" });
    expect(input).toHaveAttribute("placeholder", "Search fruit");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Apple" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Mango" })).toHaveFocus();

    await user.click(input);

    await user.type(input, "man");
    expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Mango" })).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "zzz");
    expect(await screen.findByText("No results.")).toBeInTheDocument();
  });

  it("starts panel-search selects on the first row instead of selected rows", async () => {
    const user = userEvent.setup();

    render(
      <>
        <Select items={FRUITS} defaultValue="banana">
          <SelectTrigger aria-label="Single fruit">
            <SelectValue placeholder="Pick a fruit" />
          </SelectTrigger>
          <SelectContent searchable>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="mango">Mango</SelectItem>
          </SelectContent>
        </Select>
        <Select multiple items={FRUITS} defaultValue={["banana", "mango"]}>
          <SelectTrigger aria-label="Multiple fruits">
            <SelectValue placeholder="Pick fruits" />
          </SelectTrigger>
          <SelectContent searchable>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="mango">Mango</SelectItem>
          </SelectContent>
        </Select>
      </>,
    );

    await user.click(screen.getByRole("combobox", { name: "Single fruit" }));
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("data-panel-active"),
    );
    expect(screen.getByRole("option", { name: "Banana" })).not.toHaveAttribute("data-panel-active");

    await user.click(screen.getByRole("combobox", { name: "Multiple fruits" }));
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("data-panel-active"),
    );
    expect(screen.getByRole("option", { name: "Mango" })).not.toHaveAttribute("data-panel-active");
  });
});
