import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AlignedSelect,
  AlignedSelectContent,
  AlignedSelectItem,
  AlignedSelectTrigger,
} from "./select-aligned";

const FRUITS = ["Apple", "Banana", "Cherry"];

function Fruits(props: Partial<React.ComponentProps<typeof AlignedSelect>>) {
  return (
    <AlignedSelect {...props}>
      <AlignedSelectTrigger placeholder="Pick a fruit" />
      <AlignedSelectContent>
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
