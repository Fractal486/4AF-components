import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AlignedSelect,
  AlignedSelectContent,
  AlignedSelectGroup,
  AlignedSelectGroupLabel,
  AlignedSelectItem,
  AlignedSelectTrigger,
} from "./select-aligned";

const FRUITS = ["Apple", "Banana", "Cherry"];

function Fruits({
  searchable,
  variant,
  ...props
}: Partial<React.ComponentProps<typeof AlignedSelect>> & {
  searchable?: boolean;
  variant?: "default" | "plain";
}) {
  return (
    <AlignedSelect {...props}>
      <AlignedSelectTrigger variant={variant} placeholder="Pick a fruit" />
      <AlignedSelectContent searchable={searchable}>
        {FRUITS.map((fruit) => (
          <AlignedSelectItem key={fruit} value={fruit}>
            {fruit}
          </AlignedSelectItem>
        ))}
      </AlignedSelectContent>
    </AlignedSelect>
  );
}

describe("AlignedSelect", () => {
  it("uses the shared 34px medium trigger and row size", async () => {
    const user = userEvent.setup();
    render(<Fruits size="md" />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("h-[34px]", "rounded-[8px]");
    await user.click(trigger);
    expect(await screen.findByRole("option", { name: "Apple" })).toHaveClass("min-h-[34px]");
  });

  it("renders the plain trigger as a transparent label and glyph", () => {
    render(<Fruits variant="plain" />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("data-variant", "plain");
    expect(trigger).toHaveClass("w-auto", "justify-start", "gap-1.5", "border-0", "bg-transparent", "px-0");
    expect(trigger).not.toHaveClass("bg-surface", "border-border");
    expect(trigger).toHaveTextContent("Pick a fruit");
    expect(trigger.lastElementChild?.querySelector("svg")).toBeInTheDocument();
  });

  it("shows the placeholder until something is chosen", () => {
    render(<Fruits />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Pick a fruit");
  });

  it("renders the selected value on the trigger", () => {
    render(<Fruits defaultValue="Banana" />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Banana");
  });

  it("opens over the trigger, at the trigger's width", async () => {
    const user = userEvent.setup();
    const { container } = render(<Fruits defaultValue="Banana" />);

    await user.click(screen.getByRole("combobox"));

    const positioner = container.ownerDocument.querySelector(
      '[data-slot="aligned-select-positioner"]',
    )!;
    // The panel matches the button rather than its own content, and Base UI is told to
    // overlap so the selected row lands on the trigger.
    expect(positioner.className).toContain("w-[var(--anchor-width)]");
    expect(await screen.findByRole("option", { name: "Banana" })).toHaveAttribute(
      "data-selected",
      "",
    );
  });

  it("uses content width for a plain panel while keeping the aligned positioner", async () => {
    const user = userEvent.setup();
    const { container } = render(<Fruits variant="plain" defaultValue="Banana" />);

    await user.click(screen.getByRole("combobox"));

    const positioner = container.ownerDocument.querySelector(
      '[data-slot="aligned-select-content"]',
    )!.parentElement!;
    // Plain panels use their longest row plus the reserved check slot; Base UI still owns the
    // selected-row alignment inside that content-sized positioner.
    expect(positioner.className).toContain("w-max");
    expect(positioner.className).not.toContain("w-[var(--anchor-width)]");
  });

  it("grows from the row it opens on, not from its own centre", async () => {
    const user = userEvent.setup();
    const { container } = render(<Fruits defaultValue="Banana" />);

    await user.click(screen.getByRole("combobox"));

    // Base UI points `--transform-origin` at the anchor's centre while the panel overlaps
    // it — the selected row. A centre-origin scale would move that row, which is the one
    // thing this variant exists to hold still.
    const popup = container.ownerDocument.querySelector(
      '[data-slot="aligned-select-content"]',
    )!;
    expect(popup.className).toContain("origin-[var(--transform-origin)]");
    expect(popup.className).toContain("transition-[opacity,scale,filter]");
  });

  it("reports a choice and moves the trigger to it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fruits defaultValue="Apple" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Cherry" }));

    expect(onValueChange).toHaveBeenCalledWith("Cherry", expect.anything());
    expect(screen.getByRole("combobox")).toHaveTextContent("Cherry");
  });

  it("holds a controlled value until its owner moves it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fruits value="Apple" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Cherry" }));

    expect(onValueChange).toHaveBeenCalledWith("Cherry", expect.anything());
    expect(screen.getByRole("combobox")).toHaveTextContent("Apple");
  });

  it("filters the rows as the pinned search field is typed in", async () => {
    const user = userEvent.setup();
    render(<Fruits searchable />);

    await user.click(screen.getByRole("combobox"));
    await user.type(await screen.findByRole("textbox", { name: "Search options" }), "err");

    // Gone from the tree, not merely hidden. In aligned mode Base UI writes an inline height
    // and clears it when the composite item map changes — a hidden row stays in that map, so
    // the panel would keep the size it opened at with empty space where the rows were.
    expect(screen.getByRole("option", { name: "Cherry" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("opens with the first row offered, and follows the query", async () => {
    const user = userEvent.setup();
    render(<Fruits searchable />);

    await user.click(screen.getByRole("combobox"));

    // Nothing chosen, so the top row is what Enter takes — and it says so.
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("data-panel-active"),
    );

    await user.type(await screen.findByRole("textbox", { name: "Search options" }), "err");
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("data-panel-active");
  });

  it("opens on the selected row, and hands over to the top match while filtering", async () => {
    const user = userEvent.setup();
    render(<Fruits searchable defaultValue="Banana" />);

    await user.click(screen.getByRole("combobox"));

    // The row the panel is physically sitting on is also the row Enter takes — reopening on
    // "Banana" and pressing Enter confirms Banana rather than jumping to the top of the list.
    const banana = await screen.findByRole("option", { name: "Banana" });
    await waitFor(() => expect(banana).toHaveAttribute("data-panel-active"));
    expect(screen.getByRole("option", { name: "Apple" })).not.toHaveAttribute(
      "data-panel-active",
    );

    // A query is the better guess from then on, and the selection may not even survive it.
    await user.type(await screen.findByRole("textbox", { name: "Search options" }), "err");
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("data-panel-active");
  });

  it("moves the offer with the arrows, and with the pointer", async () => {
    const user = userEvent.setup();
    render(<Fruits searchable />);

    await user.click(screen.getByRole("combobox"));
    const apple = await screen.findByRole("option", { name: "Apple" });
    await waitFor(() => expect(apple).toHaveAttribute("data-panel-active"));

    // This Select is roving-focus rather than `aria-activedescendant`, so the mark rides on
    // focus and one rule covers both modalities: whichever row has focus is the marked row.
    await user.keyboard("{ArrowDown}");
    await waitFor(() => {
      const focused = document.activeElement as HTMLElement;
      expect(focused).toHaveAttribute("role", "option");
      expect(focused).toHaveAttribute("data-panel-active");
    });
  });

  it("keeps the offer where the pointer left it", async () => {
    const user = userEvent.setup();
    render(<Fruits searchable />);

    await user.click(screen.getByRole("combobox"));
    const banana = await screen.findByRole("option", { name: "Banana" });

    await user.hover(banana);
    await waitFor(() => expect(banana).toHaveAttribute("data-panel-active"));

    // Base UI drops its own highlight when the pointer leaves the list and Select has no
    // `keepHighlight` to stop it, so reading that highlight would snap the mark back to the
    // row the panel opened on. This one is the panel's own and simply outlives it.
    await user.unhover(banana);
    await user.hover(screen.getByRole("combobox"));
    expect(banana).toHaveAttribute("data-panel-active");
    expect(screen.getByRole("option", { name: "Apple" })).not.toHaveAttribute(
      "data-panel-active",
    );
  });

  it("offers the empty message when a query matches nothing", async () => {
    const user = userEvent.setup();
    render(<Fruits searchable />);

    await user.click(screen.getByRole("combobox"));
    await user.type(await screen.findByRole("textbox", { name: "Search options" }), "zzz");

    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("takes the top match on Enter from the field", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fruits searchable onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox"));
    const field = await screen.findByRole("textbox", { name: "Search options" });
    await user.type(field, "cher{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("Cherry", expect.anything());
  });

  it("forgets the query only once the panel has finished leaving", async () => {
    const user = userEvent.setup();
    render(<Fruits searchable />);

    await user.click(screen.getByRole("combobox"));
    await user.type(await screen.findByRole("textbox", { name: "Search options" }), "cher");
    // Filtered down to the one match while the panel is still up.
    expect(screen.getAllByRole("option")).toHaveLength(1);

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByRole("textbox", { name: "Search options" })).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(FRUITS.length);
  });

  it("labels a section and ties it to its own options", async () => {
    const user = userEvent.setup();
    render(
      <AlignedSelect>
        <AlignedSelectTrigger placeholder="Pick a fruit" />
        <AlignedSelectContent>
          <AlignedSelectGroup>
            <AlignedSelectGroupLabel>Orchard</AlignedSelectGroupLabel>
            <AlignedSelectItem value="Apple">Apple</AlignedSelectItem>
          </AlignedSelectGroup>
        </AlignedSelectContent>
      </AlignedSelect>,
    );

    await user.click(screen.getByRole("combobox"));

    // Awaited, not queried on the tick after the click: Base UI wires the group's
    // `aria-labelledby` to the label after mount, so the accessible name lands a beat later.
    const group = await screen.findByRole("group");
    await waitFor(() => expect(group).toHaveAccessibleName("Orchard"));

    // Dimmed, and Base UI's own Group part — so the heading names the options rather than
    // just sitting above them.
    expect(within(group).getByText("Orchard").className).toContain("text-subtle-foreground");
  });

  it("keeps the row label at one x whether or not the row is selected", async () => {
    const user = userEvent.setup();
    render(<Fruits defaultValue="Banana" />);

    await user.click(screen.getByRole("combobox"));

    // The check is a trailing, always-reserved slot: a leading one would indent the
    // selected label and break the alignment the variant exists for.
    for (const fruit of FRUITS) {
      const option = await screen.findByRole("option", { name: fruit });
      expect(option.className).toContain("px-2.5");
      expect(option.lastElementChild?.className).toContain("size-3.5");
    }
  });
});
