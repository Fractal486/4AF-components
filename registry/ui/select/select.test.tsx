import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectSortTrigger,
  SelectSub,
  SelectSubContent,
  SelectSubTrigger,
  SelectTrigger,
  SelectValue,
} from "./select";

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
  it("uses the shared 24px xs geometry for the trigger and option rows", async () => {
    const user = userEvent.setup();
    render(
      <Select items={FRUITS} size="xs">
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveClass("h-6", "rounded-[6px]");

    await user.click(trigger);
    const option = await screen.findByRole("option", { name: "Apple" });
    expect(option).toHaveClass("h-6", "min-h-6", "py-1", "text-xs");
    expect(option).not.toHaveClass("min-h-[30px]");
  });

  it("uses the 24px xs geometry for the sort trigger", () => {
    render(
      <Select items={FRUITS} size="xs">
        <SelectSortTrigger label="Sort" aria-label="Sort fruit" />
        <FruitOptions />
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Sort fruit" });
    expect(trigger).toHaveClass("h-6", "px-2.5", "rounded-[6px]");
    expect(trigger.lastElementChild?.querySelector("svg")).toHaveClass("size-3.5");
  });

  it("uses the shared 30px/34px scale for the trigger and option rows", async () => {
    const user = userEvent.setup();
    render(
      <Select items={FRUITS} size="md">
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveClass("h-[34px]", "rounded-[8px]");
    await user.click(trigger);
    expect(await screen.findByRole("option", { name: "Apple" })).toHaveClass("min-h-[34px]");
  });

  it("renders the plain trigger as a transparent label and chevron", () => {
    render(
      <Select items={FRUITS} defaultValue="banana">
        <SelectTrigger variant="plain" aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveAttribute("data-variant", "plain");
    expect(trigger).toHaveClass("w-auto", "justify-start", "gap-1.5", "border-0", "bg-transparent", "px-0");
    expect(trigger).not.toHaveClass("bg-surface", "border-border");
    expect(trigger).toHaveTextContent("Banana");
    expect(trigger.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an optional dimmed label before the selected value", () => {
    render(
      <Select items={FRUITS} defaultValue="banana">
        <SelectTrigger label="Fruit" aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    const label = trigger.querySelector('[data-slot="select-label"]');
    expect(trigger).toHaveTextContent("Fruit: Banana");
    expect(label).toHaveTextContent("Fruit:");
    expect(label).toHaveClass("text-muted-foreground");
  });

  it("renders ghost triggers with default geometry and Button ghost colors", () => {
    render(
      <Select items={FRUITS}>
        <SelectSortTrigger
          variant="ghost"
          icon={<span data-testid="ghost-sort-icon" />}
          label="Sort"
          aria-label="Sort fruit"
        />
        <FruitOptions />
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Sort fruit" });
    expect(trigger).toHaveAttribute("data-variant", "ghost");
    expect(trigger).toHaveClass(
      "gap-2",
      "border-transparent",
      "bg-transparent",
      "text-muted-foreground",
      "hover:bg-muted",
      "hover:text-foreground",
    );
    expect(trigger).not.toHaveClass("gap-1.5", "border-0", "px-0");
    expect(screen.getByTestId("ghost-sort-icon").parentElement).toBe(trigger.firstElementChild);
    expect(trigger.lastElementChild).toHaveClass("shrink-0");
    expect(trigger.lastElementChild).not.toHaveClass("order-3");
  });

  it("keeps the sort icon leading and puts the chevron after the label", () => {
    render(
      <Select items={FRUITS} defaultValue="banana">
        <SelectSortTrigger
          variant="plain"
          icon={<span data-testid="sort-icon" />}
          label="Sort"
          aria-label="Sort fruit"
        />
        <FruitOptions />
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Sort fruit" });
    expect(trigger).toHaveAttribute("data-variant", "plain");
    expect(trigger).toHaveClass("border-0", "bg-transparent", "px-0");
    expect(trigger).not.toHaveClass("bg-muted", "border-border");
    const sortIcon = screen.getByTestId("sort-icon").parentElement;
    expect(sortIcon).toBe(trigger.firstElementChild);
    expect(screen.getByText("Sort").parentElement).not.toHaveClass("order-1");
    expect(sortIcon).not.toHaveClass("order-2");
    expect(trigger.lastElementChild).toHaveClass("order-3");
  });

  it("sizes a plain panel to its longest option and check slot by default", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select items={FRUITS} defaultValue="banana">
        <SelectTrigger variant="plain" aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    await screen.findByRole("option", { name: "Mango" });

    // `w-max` lets the rows establish the panel width. Each row reserves its trailing check
    // slot, so the widest label determines the visible box without the trigger's width floor.
    expect(container.ownerDocument.querySelector('[data-slot="select-content-positioner"]')).toHaveClass(
      "w-max",
    );
  });

  it("uses content width for a plain sort panel by default", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select items={FRUITS} defaultValue="banana">
        <SelectSortTrigger variant="plain" label="Sort" aria-label="Sort fruit" />
        <FruitOptions />
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Sort fruit" }));
    await screen.findByRole("option", { name: "Mango" });

    expect(container.ownerDocument.querySelector('[data-slot="select-content-positioner"]')).toHaveClass(
      "w-max",
    );
  });

  it("renders an accessible separator without adding a selectable option", async () => {
    const user = userEvent.setup();

    render(
      <Select items={FRUITS}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectSeparator />
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Fruit" }));

    const separator = await screen.findByRole("separator");
    expect(separator).toHaveAttribute("data-slot", "select-separator");
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");
    expect(screen.getAllByRole("option")).toHaveLength(2);

    await user.click(screen.getByRole("option", { name: "Banana" }));
    expect(screen.getByRole("combobox", { name: "Fruit" })).toHaveTextContent("Banana");
  });

  it("moves the row highlight exclusively to the xs ghost clear footer on hover", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select multiple size="md" items={FRUITS} defaultValue={["banana"]} onValueChange={onValueChange}>
        <SelectTrigger aria-label="Fruits">
          <SelectValue placeholder="Pick fruits" />
        </SelectTrigger>
        <SelectContent clearable>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruits" });
    await user.click(trigger);

    const clearButton = await screen.findByRole("button", { name: "Clear" });
    const separator = screen.getByRole("separator");
    const apple = screen.getByRole("option", { name: "Apple" });
    expect(clearButton).toHaveAttribute("data-variant", "ghost");
    expect(clearButton).toHaveAttribute("data-size", "xs");
    expect(clearButton).toHaveClass("h-6");
    expect(clearButton).not.toHaveClass("min-h-[34px]");
    expect(clearButton).toHaveClass("text-muted-foreground", "hover:bg-muted");
    expect(separator).toHaveClass("mx-0", "my-0", "w-full");
    expect(separator.nextElementSibling?.contains(clearButton)).toBe(true);

    await user.hover(apple);
    await waitFor(() => expect(apple).toHaveAttribute("data-panel-active"));

    await user.hover(clearButton);
    await waitFor(() => expect(clearButton).toHaveAttribute("data-panel-active"));
    expect(clearButton).toHaveFocus();
    expect(
      screen.getAllByRole("option").every((option) => !option.hasAttribute("data-panel-active")),
    ).toBe(true);
    expect(apple).not.toHaveClass("data-[highlighted]:bg-muted");

    await user.click(clearButton);
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith([]));
    expect(clearButton).toBeDisabled();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

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

  it("opens a nested panel and commits its options through the outer select", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select
        items={FRUITS}
        onValueChange={onValueChange}
        defaultValue="apple"
      >
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectSub>
            <SelectSubTrigger>More fruit</SelectSubTrigger>
            <SelectSubContent>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="mango">Mango</SelectItem>
            </SelectSubContent>
          </SelectSub>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(trigger);
    const subTrigger = screen.getByRole("option", { name: "More fruit" });
    await user.click(subTrigger);

    const subContent = await waitFor(() => {
      const content = document.querySelector<HTMLElement>('[data-slot="select-sub-content"]');
      expect(content).not.toBeNull();
      return content;
    });
    expect(subContent).toHaveAttribute("data-slot", "select-sub-content");
    const firstNestedOption = screen.getByRole("option", { name: "Banana" });
    expect(firstNestedOption).not.toHaveClass("data-[highlighted]:bg-muted");
    expect(firstNestedOption).toHaveClass("hover:bg-muted");
    expect(
      document.querySelector('[data-slot="select-content-positioner"]')?.contains(subContent),
    ).toBe(false);
    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="select-sub-positioner"]'),
    ).toHaveClass("z-50");

    await user.click(screen.getByRole("option", { name: "Mango" }));

    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith("mango", expect.anything()));
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(trigger).toHaveTextContent("Mango");

    await user.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    expect(trigger).toHaveTextContent("Mango");
  });

  it("keeps nested multi-select options open and renders their check state", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select multiple onValueChange={onValueChange} items={FRUITS}>
        <SelectTrigger aria-label="Fruits">
          <SelectValue placeholder="Pick fruits" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectSub>
            <SelectSubTrigger>More fruit</SelectSubTrigger>
            <SelectSubContent>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="mango">Mango</SelectItem>
            </SelectSubContent>
          </SelectSub>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruits" });
    await user.click(trigger);
    const subTrigger = await screen.findByRole("option", { name: "More fruit" });
    const selectedCount = subTrigger.querySelector('[data-slot="select-sub-count"]');
    expect(subTrigger).toHaveAttribute("data-selected-count", "0");
    expect(selectedCount).toHaveTextContent("0");
    expect(selectedCount).toHaveClass("text-muted-foreground/60");
    expect(selectedCount?.nextElementSibling).toBe(subTrigger.querySelector("svg"));
    await user.click(subTrigger);
    const mango = await screen.findByRole("option", { name: "Mango" });
    await user.click(mango);

    await waitFor(() =>
      expect(onValueChange).toHaveBeenLastCalledWith(["mango"], expect.anything()),
    );
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(mango).toHaveAttribute("aria-selected", "true");
    expect(mango.querySelector('[role="checkbox"]')).toHaveAttribute("aria-checked", "true");
    expect(subTrigger).toHaveAttribute("data-selected-count", "1");
    expect(selectedCount).toHaveTextContent("1");
  });

  it("supports nested options in the multi-select filter trigger", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select<string, true>
        multiple
        items={{ active: "Active", archived: "Archived" }}
        defaultValue={["archived"]}
        onValueChange={onValueChange}
      >
        <SelectSortTrigger label="Filter" aria-label="Filter projects" />
        <SelectContent>
          <SelectSub>
            <SelectSubTrigger>More statuses</SelectSubTrigger>
            <SelectSubContent>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectSubContent>
          </SelectSub>
          <SelectItem value="active">Active</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Filter projects" });
    await user.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    const subTrigger = await screen.findByRole("option", { name: "More statuses" });
    await waitFor(() => expect(subTrigger).toHaveAttribute("data-panel-active"));
    expect(subTrigger).toHaveAttribute("data-selected-count", "1");
    await user.click(subTrigger);
    await user.click(await screen.findByRole("option", { name: "Archived" }));

    await waitFor(() =>
      expect(onValueChange).toHaveBeenLastCalledWith([], expect.anything()),
    );
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(subTrigger).toHaveAttribute("data-selected-count", "0");
  });

  it("selects a nested option when a touchpad tap omits pointerdown", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select items={FRUITS} defaultValue="apple" onValueChange={onValueChange}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectSub>
            <SelectSubTrigger>More fruit</SelectSubTrigger>
            <SelectSubContent>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="mango">Mango</SelectItem>
            </SelectSubContent>
          </SelectSub>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "More fruit" }));
    const mango = await screen.findByRole("option", { name: "Mango" });

    fireEvent.mouseDown(mango, { button: 0 });
    fireEvent.mouseUp(mango, { button: 0 });
    fireEvent.click(mango, { button: 0, detail: 1 });

    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith("mango", expect.anything()));
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(trigger).toHaveTextContent("Mango");
  });

  it("opens nested options from the keyboard and returns to the parent row", async () => {
    const user = userEvent.setup();

    render(
      <Select items={FRUITS} defaultValue="apple">
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectSub>
            <SelectSubTrigger>More fruit</SelectSubTrigger>
            <SelectSubContent>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="mango">Mango</SelectItem>
            </SelectSubContent>
          </SelectSub>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(trigger);
    await user.keyboard("{ArrowDown}{ArrowRight}");

    const subContent = await waitFor(() => {
      const content = document.querySelector<HTMLElement>('[data-slot="select-sub-content"]');
      expect(content).not.toBeNull();
      return content;
    });
    expect(document.activeElement).toBe(
      subContent?.querySelector('[role="option"]:not([aria-disabled="true"])'),
    );

    await user.keyboard("{ArrowLeft}");
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "More fruit" })).toHaveFocus(),
    );
  });

  it("opens a nested panel on its selected option", async () => {
    const user = userEvent.setup();

    render(
      <Select items={FRUITS} defaultValue="mango">
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectSub>
            <SelectSubTrigger>More fruit</SelectSubTrigger>
            <SelectSubContent>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="mango">Mango</SelectItem>
            </SelectSubContent>
          </SelectSub>
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    await user.click(await screen.findByRole("option", { name: "More fruit" }));
    await waitFor(() => expect(screen.getByRole("option", { name: "Mango" })).toHaveFocus());
  });

  it("opens a nested panel from pointer hover", async () => {
    const user = userEvent.setup();

    render(
      <Select items={FRUITS}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectSub>
            <SelectSubTrigger closeDelay={0}>
              More fruit
            </SelectSubTrigger>
            <SelectSubContent>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectSubContent>
          </SelectSub>
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    const subTrigger = await screen.findByRole("option", { name: "More fruit" });
    await user.hover(subTrigger);
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("option", { name: "Banana" })).toBeInTheDocument();

    await user.unhover(subTrigger);
    await waitFor(() => expect(subTrigger).toHaveAttribute("aria-expanded", "false"));
  });

  it("commits a nested option from the keyboard like a regular select item", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select items={FRUITS} defaultValue="apple" onValueChange={onValueChange}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectSub>
            <SelectSubTrigger>More fruit</SelectSubTrigger>
            <SelectSubContent>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="mango">Mango</SelectItem>
            </SelectSubContent>
          </SelectSub>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(trigger);
    await user.keyboard("{ArrowDown}{ArrowRight}");
    await waitFor(() => expect(screen.getByRole("option", { name: "Banana" })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(screen.getByRole("option", { name: "Mango" })).toHaveFocus());
    await user.keyboard("{Enter}");

    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith("mango", expect.anything()));
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(trigger).toHaveTextContent("Mango");
  });

  it("opens a select on its selected option, and on its first when there is none", async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <Select items={FRUITS} defaultValue="banana">
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    // A panel with no field has no separate keyboard: focus is the highlight, so the row the
    // panel marks active is the row that takes it.
    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    await waitFor(() => expect(screen.getByRole("option", { name: "Banana" })).toHaveFocus());
    unmount();

    render(
      <Select items={FRUITS}>
        <SelectTrigger aria-label="Empty fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <FruitOptions />
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Empty fruit" }));
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

    const option = await screen.findByRole("option", { name: "Apple" });
    expect(option.querySelector('[data-testid="fruit-icon"]')?.parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("shows a preselected value's icon from items, before the panel has ever mounted", () => {
    render(
      <Select
        items={[
          { value: "apple", label: "Apple", icon: <span data-testid="apple-icon" /> },
          { value: "banana", label: "Banana", icon: <span data-testid="banana-icon" /> },
        ]}
        defaultValue="apple"
      >
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple" icon={<span data-testid="apple-icon" />}>
            Apple
          </SelectItem>
          <SelectItem value="banana" icon={<span data-testid="banana-icon" />}>
            Banana
          </SelectItem>
        </SelectContent>
      </Select>,
    );

    // No click first: the items register their icons when the popup mounts, so this is
    // the one render where only `items` can answer — and it's every cold load.
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveTextContent("Apple");
    expect(trigger.querySelector('[data-testid="apple-icon"]')).toBeInTheDocument();
    expect(trigger.querySelector('[data-testid="banana-icon"]')).not.toBeInTheDocument();
  });

  it("lets iconForValue win over the items icon", () => {
    render(
      <Select
        items={[{ value: "apple", label: "Apple", icon: <span data-testid="declared" /> }]}
        defaultValue="apple"
        iconForValue={() => <span data-testid="computed" />}
      >
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger.querySelector('[data-testid="computed"]')).toBeInTheDocument();
    expect(trigger.querySelector('[data-testid="declared"]')).not.toBeInTheDocument();
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
    // Awaited: the panel is portalled and mounts through AnimatePresence, so under load the
    // field can land a tick after the click.
    const input = await screen.findByRole("textbox", { name: "Search options" });
    expect(input).toHaveAttribute("placeholder", "Search fruit");
    expect(input).toHaveClass("h-full");
    expect(input).toHaveClass("p-0");
    expect(input.parentElement).toHaveClass("h-[38px]", "px-3.5");
    expect(input.parentElement?.querySelector("svg")).not.toBeInTheDocument();

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

  it("includes rows from nested panels in the panel search", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select items={FRUITS} defaultValue="apple" onValueChange={onValueChange}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent searchable>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectSub>
            <SelectSubTrigger>More fruit</SelectSubTrigger>
            <SelectSubContent>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="mango">Mango</SelectItem>
            </SelectSubContent>
          </SelectSub>
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    const input = await screen.findByRole("textbox", { name: "Search options" });
    await user.type(input, "mango");

    const subTrigger = screen.getByRole("option", { name: "More fruit" });
    expect(subTrigger).toHaveAttribute("data-panel-active");
    expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Mango" })).not.toBeInTheDocument();

    await user.click(subTrigger);
    expect(screen.getByRole("option", { name: "Mango" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Banana" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Mango" }));
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith("mango", expect.anything()));
  });

  it("opens panel-search selects on their selected rows", async () => {
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

    // The field keeps DOM focus while the mark sits on the selection, so Enter confirms the
    // standing choice rather than silently moving it to the top of the list.
    await user.click(screen.getByRole("combobox", { name: "Single fruit" }));
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute("data-panel-active"),
    );
    expect(screen.getByRole("option", { name: "Apple" })).not.toHaveAttribute("data-panel-active");

    // Several selections: the most recent one, which is how Base UI's Combobox resolves it in
    // the two search variants. All five open on the same row or none of this is a rule.
    await user.click(screen.getByRole("combobox", { name: "Multiple fruits" }));
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Mango" })).toHaveAttribute("data-panel-active"),
    );
    expect(screen.getByRole("option", { name: "Banana" })).not.toHaveAttribute(
      "data-panel-active",
    );
  });

  it("holds the active row while a multi-select's checkboxes are toggled", async () => {
    const user = userEvent.setup();

    render(
      <Select multiple items={FRUITS} defaultValue={["banana", "mango"]}>
        <SelectTrigger aria-label="Fruits">
          <SelectValue placeholder="Pick fruits" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="mango">Mango</SelectItem>
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Fruits" }));
    const mango = await screen.findByRole("option", { name: "Mango" });
    await waitFor(() => expect(mango).toHaveAttribute("data-panel-active"));

    // The opening row is decided once, when the panel opens. Toggling a checkbox changes the
    // selection but not where the user is in the list — the panel stays open under a pointer
    // that has not moved, so anything that re-aims the active row yanks it out from under it.
    await user.click(mango);
    expect(mango).toHaveAttribute("data-panel-active");
    expect(screen.getByRole("option", { name: "Banana" })).not.toHaveAttribute(
      "data-panel-active",
    );

    // And the same on the way to an empty selection, which would otherwise fall back to the
    // top row. The active row is the row that was pressed, both times.
    const banana = screen.getByRole("option", { name: "Banana" });
    await user.click(banana);
    expect(banana).toHaveAttribute("data-panel-active");
    expect(screen.getByRole("option", { name: "Apple" })).not.toHaveAttribute(
      "data-panel-active",
    );
  });

  it("runs the highlighted row on Enter, straight from the search field", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select items={FRUITS} onValueChange={onValueChange}>
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
    const search = await screen.findByPlaceholderText("Search fruit");
    await user.type(search, "man");

    // The caret never leaves the field: no arrow press, so nothing in the list has DOM
    // focus. Enter still has to run whatever the panel is showing as active.
    const active = screen.getByRole("option", { name: "Mango" });
    expect(active).toHaveAttribute("data-panel-active");

    await user.keyboard("{Enter}");
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith("mango", expect.anything()));
  });
});
