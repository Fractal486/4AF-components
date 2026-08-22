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
  ...props
}: Partial<React.ComponentProps<typeof AlignedSelect>> & { searchable?: boolean }) {
  return (
    <AlignedSelect {...props}>
      <AlignedSelectTrigger placeholder="Pick a fruit" />
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
      '[data-slot="aligned-select-content"]',
    )!.parentElement!;
    // The panel matches the button rather than its own content, and Base UI is told to
    // overlap so the selected row lands on the trigger.
    expect(positioner.className).toContain("w-[var(--anchor-width)]");
    expect(await screen.findByRole("option", { name: "Banana" })).toHaveAttribute(
      "data-selected",
      "",
    );
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
