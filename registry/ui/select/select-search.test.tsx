import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
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
  size = "sm",
}: {
  defaultValue?: Fruit;
  onValueChange?: (value: Fruit | null) => void;
  size?: "sm" | "md";
}) {
  return (
    <SearchSelect<Fruit>
      items={FRUITS}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      size={size}
      iconForValue={(value) =>
        value.value === "apple" ? <span data-testid="fruit-icon" /> : undefined
      }
    >
      <SearchSelectInput aria-label="Fruit" placeholder="Search fruit" />
      <SearchSelectContent emptyMessage="No fruit found.">
        {(item: Fruit) => (
          <SearchSelectItem
            key={item.value}
            value={item}
            icon={item.value === "apple" ? <span data-testid="fruit-icon" /> : undefined}
          >
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

function DynamicMultiIcon() {
  const [showItem, setShowItem] = useState(true);

  return (
    <SearchSelect<Fruit> items={FRUITS} defaultOpen defaultValue={FRUITS[0]}>
      <button type="button" onClick={() => setShowItem(false)}>
        Remove item
      </button>
      <SearchSelectInput aria-label="Dynamic fruit" placeholder="Search fruit" />
      <SearchSelectContent emptyMessage="No fruit found.">
        {(item: Fruit) =>
          showItem ? (
            <SearchMultiSelectItem
              key={item.value}
              value={item}
              icon={item.value === "apple" ? <span data-testid="dynamic-fruit-icon" /> : undefined}
            >
              {item.label}
            </SearchMultiSelectItem>
          ) : null
        }
      </SearchSelectContent>
    </SearchSelect>
  );
}

describe("Search Select", () => {
  it("uses the shared 34px medium field and row size", async () => {
    const user = userEvent.setup();
    render(<FruitSearch size="md" />);

    const input = screen.getByRole("combobox", { name: "Fruit" });
    expect(input).toHaveClass("h-[34px]", "rounded-[8px]");
    await user.click(input);
    expect(await screen.findByRole("option", { name: "Apple" })).toHaveClass("min-h-[34px]");
  });

  it("gives an empty result the same footprint as one option row", async () => {
    const user = userEvent.setup();
    render(<FruitSearch />);

    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(input);
    await user.type(input, "pear");

    // The row's own vertical padding inside a margin mirroring the list's, rather than a
    // fixed height — that is what makes it one row tall at `sm` as well as `md`.
    const empty = await screen.findByText("No fruit found.");
    expect(empty).toHaveClass("m-1", "py-1.5");
    expect(empty).not.toHaveClass("h-8");
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
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Mango");
  });

  it("types over the dimmed selection and restores it after clicking outside", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<><FruitSearch defaultValue={FRUITS[1]} onValueChange={onValueChange} /><button>Outside</button></>);
    const input = screen.getByRole("combobox", { name: "Fruit" });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Mango");
    expect(input).toHaveAttribute("data-selected-label");
    await user.click(input);
    expect(input).not.toHaveAttribute("data-selected-label");
    expect(input).toHaveAttribute("placeholder", "Mango");
    await user.type(input, "app");
    expect(input).toHaveValue("app");
    expect(await screen.findByRole("option", { name: "Apple" })).toHaveAttribute("data-highlighted");
    await user.click(screen.getByText("Outside", { selector: "button" }));
    await waitFor(() => expect(input).toHaveValue(""));
    expect(input).toHaveAttribute("placeholder", "Mango");
    expect(input).toHaveAttribute("data-selected-label");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(input);
    expect(await screen.findByRole("option", { name: "Mango" })).toHaveAttribute("data-highlighted");
  });

  it("preserves the selection when the query is deleted or escaped", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FruitSearch defaultValue={FRUITS[1]} onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.type(input, "app");
    await user.clear(input);
    expect(input).toHaveAttribute("placeholder", "Mango");
    await user.type(input, "pear");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(input).toHaveValue(""));
    expect(input).toHaveAttribute("placeholder", "Mango");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("supports controlled selection and query with custom labels", async () => {
    function ControlledSearch() {
      const [value, setValue] = useState<Fruit | null>(FRUITS[1]);
      const [query, setQuery] = useState("");
      return (
        <SearchSelect<Fruit> items={FRUITS} value={value} onValueChange={setValue}
          inputValue={query} onInputValueChange={setQuery}
          itemToStringLabel={(item) => `Fruit: ${item.label}`}>
          <SearchSelectInput aria-label="Controlled fruit" />
          <SearchSelectContent>{(item: Fruit) => (
            <SearchSelectItem key={item.value} value={item}>{item.label}</SearchSelectItem>
          )}</SearchSelectContent>
        </SearchSelect>
      );
    }
    const user = userEvent.setup();
    render(<ControlledSearch />);
    const input = screen.getByRole("combobox", { name: "Controlled fruit" });
    expect(input).toHaveAttribute("placeholder", "Fruit: Mango");
    await user.type(input, "app");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(input).toHaveValue(""));
    expect(input).toHaveAttribute("placeholder", "Fruit: Mango");
    await user.type(input, "app");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Fruit: Apple");
  });

  it("opens and reopens a single select on its selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FruitSearch defaultValue={FRUITS[1]} onValueChange={onValueChange} />);

    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(input);

    expect(await screen.findByRole("option", { name: "Mango" })).toHaveAttribute(
      "data-highlighted",
    );

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());

    await user.click(input);
    expect(await screen.findByRole("option", { name: "Mango" })).toHaveAttribute(
      "data-highlighted",
    );

    // Enter on an untouched panel confirms the standing choice instead of quietly moving it
    // to the top of the list.
    await user.keyboard("{Enter}");
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(FRUITS[1], expect.anything()));
  });

  it("opens a multi-select on a chosen row, and typing moves to the top match", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FruitSearchMulti defaultValue={[FRUITS[1]]} onValueChange={onValueChange} />);

    const input = screen.getByRole("combobox", { name: "Fruits" });
    await user.click(input);

    expect(await screen.findByRole("option", { name: "Mango" })).toHaveAttribute(
      "data-highlighted",
    );

    // A query is a better guess at what Enter should take than a choice made earlier, so the
    // mark leaves the selection as soon as the list is narrowed.
    await user.type(input, "app");
    expect(await screen.findByRole("option", { name: "Apple" })).toHaveAttribute(
      "data-highlighted",
    );

    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(onValueChange).toHaveBeenCalledWith([FRUITS[1], FRUITS[0]], expect.anything()),
    );
  });

  it("opens with the first row selected when nothing is chosen yet", async () => {
    const user = userEvent.setup();
    render(<FruitSearch />);

    await user.click(screen.getByRole("combobox", { name: "Fruit" }));

    // `autoHighlight="always"` covers the empty case; a bare `true` would wait for a
    // keystroke, and a panel never opens with nothing ready.
    expect(await screen.findByRole("option", { name: "Apple" })).toHaveAttribute(
      "data-highlighted",
    );
  });

  it("holds the highlight on a multi-select row that is toggled off", async () => {
    const user = userEvent.setup();
    render(<FruitSearchMulti defaultValue={[FRUITS[1]]} />);

    const input = screen.getByRole("combobox", { name: "Fruits" });
    await user.click(input);

    const mango = await screen.findByRole("option", { name: "Mango" });
    expect(mango).toHaveAttribute("data-highlighted");

    // Unchecking the row under the pointer must not send the highlight anywhere — not to
    // another chosen row, and not back to the top of the list.
    await user.click(mango);
    expect(mango).toHaveAttribute("data-highlighted");
    expect(screen.getByRole("option", { name: "Apple" })).not.toHaveAttribute(
      "data-highlighted",
    );
  });

  it("leaves the highlight where the pointer left it", async () => {
    const user = userEvent.setup();
    render(<FruitSearch />);

    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(input);

    const mango = await screen.findByRole("option", { name: "Mango" });
    await user.hover(mango);
    expect(mango).toHaveAttribute("data-highlighted");

    // `keepHighlight`. Without it Base UI clears the active row on pointer-leave and
    // `autoHighlight` puts it straight back on row one, so a pointer that merely wandered out
    // of the panel would silently re-aim Enter at the top of the list.
    await user.unhover(mango);
    await user.hover(input);
    expect(mango).toHaveAttribute("data-highlighted");
    expect(screen.getByRole("option", { name: "Apple" })).not.toHaveAttribute("data-highlighted");
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

  it("replaces the selected icon with a dimmed search icon while focused", async () => {
    const user = userEvent.setup();
    render(<FruitSearch defaultValue={FRUITS[0]} />);

    const input = screen.getByRole("combobox", { name: "Fruit" });
    expect(input.parentElement?.querySelector('[data-testid="fruit-icon"]')).toBeInTheDocument();
    await user.click(input);
    expect(input.parentElement?.querySelector('[data-testid="fruit-icon"]')).not.toBeInTheDocument();
    const searchIcon = input.parentElement?.querySelector(".lucide-search");
    expect(searchIcon).toHaveClass("text-muted-foreground");
    expect(searchIcon?.parentElement).toHaveAttribute("aria-hidden", "true");
    expect(input).toHaveClass("pl-10");
    await user.type(input, "man");
    expect(input.parentElement?.querySelector(".lucide-search")).toBeInTheDocument();
    await user.click(document.body);
    await waitFor(() => expect(input).toHaveValue(""));
    expect(input.parentElement?.querySelector(".lucide-search")).not.toBeInTheDocument();
    expect(input.parentElement?.querySelector('[data-testid="fruit-icon"]')).toBeInTheDocument();
  });

  it("does not add a search icon when the selection has no icon", async () => {
    const user = userEvent.setup();
    render(<FruitSearch defaultValue={FRUITS[1]} />);
    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(input);
    expect(input.parentElement?.querySelector(".lucide-search")).not.toBeInTheDocument();
    expect(input).not.toHaveClass("pl-10");
  });

  it("unregisters icons when dynamic multi-select items unmount", async () => {
    render(<DynamicMultiIcon />);

    const input = screen.getByRole("combobox", { name: "Dynamic fruit" });
    await waitFor(() =>
      expect(input.parentElement?.querySelector('[data-testid="dynamic-fruit-icon"]')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Remove item", { selector: "button" }));
    await waitFor(() =>
      expect(input.parentElement?.querySelector('[data-testid="dynamic-fruit-icon"]')).not.toBeInTheDocument(),
    );
  });

  it("shows a preselected value's icon before the panel has ever mounted", () => {
    const withIcons = [
      { ...FRUITS[0], icon: <span data-testid="apple-icon" /> },
      { ...FRUITS[1], icon: <span data-testid="mango-icon" /> },
    ];
    type IconFruit = (typeof withIcons)[number];

    const { container } = render(
      <SearchSelect<IconFruit> items={withIcons} defaultValue={withIcons[0]}>
        <SearchSelectInput aria-label="Fruit" placeholder="Search fruit" />
        <SearchSelectContent emptyMessage="No fruit found.">
          {(item: IconFruit) => (
            <SearchSelectItem key={item.value} value={item} icon={item.icon}>
              {item.label}
            </SearchSelectItem>
          )}
        </SearchSelectContent>
      </SearchSelect>,
    );

    // No click first: an item registers its icon when the popup mounts, so this is the
    // one render where only the value's own `icon` can answer — and it's every cold load.
    expect(container.querySelector('[data-testid="apple-icon"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="mango-icon"]')).not.toBeInTheDocument();
  });
});
