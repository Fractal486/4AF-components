import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  SearchMultiSelectItem,
  SearchSelect,
  SearchSelectContent,
  SearchSelectInput,
  SearchSelectItem,
} from "./select-search";

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "mango", label: "Mango" },
] as const;

type Fruit = (typeof FRUITS)[number];

function FruitSearch({
  defaultValue,
  onValueChange,
}: {
  defaultValue?: Fruit;
  onValueChange?: (value: Fruit | null) => void;
}) {
  return (
    <SearchSelect<Fruit> items={FRUITS} defaultValue={defaultValue} onValueChange={onValueChange}>
      <SearchSelectInput aria-label="Fruit" placeholder="Search fruit" />
      <SearchSelectContent emptyMessage="No fruit found.">
        {(item: Fruit) => (
          <SearchSelectItem key={item.value} value={item}>
            {item.label}
          </SearchSelectItem>
        )}
      </SearchSelectContent>
    </SearchSelect>
  );
}

function FruitSearchMulti({
  onValueChange,
  defaultValue = [FRUITS[0]],
}: {
  onValueChange?: (value: Fruit[]) => void;
  defaultValue?: Fruit[];
}) {
  return (
    <SearchSelect
      multiple
      items={FRUITS}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <SearchSelectInput aria-label="Fruits" placeholder="Search fruits" />
      <SearchSelectContent emptyMessage="No fruit found.">
        {(item: Fruit) => (
          <SearchMultiSelectItem key={item.value} value={item}>
            {item.label}
          </SearchMultiSelectItem>
        )}
      </SearchSelectContent>
    </SearchSelect>
  );
}

describe("Search Select", () => {
  it("gives an empty result the same footprint as one option row", async () => {
    const user = userEvent.setup();
    render(<FruitSearch />);

    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(input);
    await user.type(input, "pear");

    expect(await screen.findByText("No fruit found.")).toHaveClass("m-1", "h-8");
    expect(screen.getByRole("listbox")).toHaveClass("empty:hidden");
  });

  it("filters items and commits the highlighted match from the keyboard", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FruitSearch onValueChange={onValueChange} />);

    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(input);
    await user.type(input, "man");

    expect(await screen.findByRole("option", { name: "Mango" })).toHaveAttribute(
      "data-highlighted",
    );
    expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument();

    await user.keyboard("{Enter}");

    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(FRUITS[1], expect.anything()));
    expect(input).toHaveValue("Mango");
  });

  it("opens a single select on the first choice instead of its later selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FruitSearch defaultValue={FRUITS[1]} onValueChange={onValueChange} />);

    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(input);

    expect(await screen.findByRole("option", { name: "Apple" })).toHaveAttribute(
      "data-highlighted",
    );

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());

    await user.click(input);
    expect(await screen.findByRole("option", { name: "Apple" })).toHaveAttribute(
      "data-highlighted",
    );

    await user.keyboard("{Enter}");
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(FRUITS[0], expect.anything()));
  });

  it("opens and reopens on the first visible choice, even with a later selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FruitSearchMulti defaultValue={[FRUITS[1]]} onValueChange={onValueChange} />);

    const input = screen.getByRole("combobox", { name: "Fruits" });
    await user.click(input);

    expect(await screen.findByRole("option", { name: "Apple" })).toHaveAttribute(
      "data-highlighted",
    );

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());

    await user.click(input);
    expect(await screen.findByRole("option", { name: "Apple" })).toHaveAttribute(
      "data-highlighted",
    );

    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(onValueChange).toHaveBeenCalledWith([FRUITS[1], FRUITS[0]], expect.anything()),
    );
  });

  it("keeps checkbox selection open and starts at the first filtered result", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FruitSearchMulti onValueChange={onValueChange} />);

    const input = screen.getByRole("combobox", { name: "Fruits" });
    expect(input).toHaveAttribute("placeholder", "1 selected");

    await user.click(input);
    expect(input).toHaveAttribute("placeholder", "Search fruits");
    await user.type(input, "man");

    const mango = await screen.findByRole("option", { name: "Mango" });
    expect(mango).toHaveAttribute("data-highlighted");
    expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument();

    await user.click(mango);

    await waitFor(() =>
      expect(onValueChange).toHaveBeenCalledWith([FRUITS[0], FRUITS[1]], expect.anything()),
    );
    expect(screen.getByRole("listbox")).toBeVisible();

    const checkbox = mango.querySelector<HTMLElement>("[role=checkbox]");
    expect(checkbox).toHaveAttribute("aria-hidden", "true");
    expect(checkbox).toHaveAttribute("tabindex", "-1");
    expect(checkbox).toHaveAttribute("aria-checked", "true");
    expect(checkbox).toHaveAttribute("data-checked");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(input).toHaveValue(""));
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("placeholder", "Search fruits");

    await user.tab();
    await waitFor(() => expect(input).toHaveAttribute("placeholder", "2 selected"));
  });
});
