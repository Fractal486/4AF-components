import { Field } from "@base-ui/react/field";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Select, SelectContent, SelectGroup, SelectGroupLabel, SelectItem, SelectSeparator, SelectSortTrigger, SelectTrigger, SelectValue } from "./select";
import { AlignedSelect, AlignedSelectContent, AlignedSelectGroup, AlignedSelectGroupLabel, AlignedSelectItem, AlignedSelectTrigger } from "./select-aligned";
import { SearchSelect, SearchSelectCollection, SearchSelectContent, SearchSelectGroup, SearchSelectGroupLabel, SearchSelectInput, SearchSelectItem, SearchMultiSelectItem } from "./select-search";

const items = [{ value: "apple", label: "Apple" }, { value: "berry", label: "Berry" }];
const groups = [{ label: "Orchard", items: [items[0]!] }, { label: "Berries", items: [items[1]!] }];

describe("Select family composition", () => {
  it("names regular sections and evaluates trigger, value, popup, row, and section classes", async () => {
    const user = userEvent.setup();
    const groupRef = createRef<HTMLDivElement>();
    render(<Select items={{ apple: "Apple", berry: "Berry" }} defaultValue="apple">
      <SelectTrigger aria-label="Fruit" className={({ open }) => open ? "open-trigger" : "closed-trigger"}>
        <SelectValue className={({ value }) => value === "apple" ? "apple-value" : "berry-value"} />
      </SelectTrigger>
      <SelectContent className={({ open }) => open ? "open-popup" : undefined}>
        <SelectGroup ref={groupRef} className={() => "fruit-section"}>
          <SelectGroupLabel className={() => "fruit-heading"}>Fruit</SelectGroupLabel>
          {items.map((item) => <SelectItem key={item.value} value={item.value} className={({ selected }) => selected ? "selected-row" : "ordinary-row"}>{item.label}</SelectItem>)}
        </SelectGroup>
        <SelectSeparator className={() => "divider"} />
      </SelectContent>
    </Select>);
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveClass("closed-trigger");
    expect(trigger.querySelector(".apple-value")).not.toBeNull();
    await user.click(trigger);
    await waitFor(() => expect(trigger).toHaveClass("open-trigger"));
    expect(groupRef.current).toBe(screen.getByRole("group", { name: "Fruit" }));
    expect(groupRef.current).toHaveClass("fruit-section");
    expect(screen.getByRole("option", { name: "Apple" })).toHaveClass("selected-row");
    expect(document.querySelector(".open-popup .divider")).not.toBeNull();
    await user.click(screen.getByRole("option", { name: "Berry" }));
    await waitFor(() => expect(trigger.querySelector(".berry-value")).not.toBeNull());
  });

  it.each([false, true])("filters grouped search items and supports selection (multiple=%s)", async (multiple) => {
    const user = userEvent.setup();
    const change = vi.fn();
    const Item = multiple ? SearchMultiSelectItem : SearchSelectItem;
    render(<SearchSelect items={groups} multiple={multiple} onValueChange={change}>
      <SearchSelectInput aria-label="Fruit" placeholder="Choose fruit" className={({ open }) => open ? "open-input text-lg" : "closed-input"} />
      <SearchSelectContent>
        {(group: typeof groups[number]) => <SearchSelectGroup items={group.items} key={group.label} className={() => "fruit-section"}>
          <SearchSelectGroupLabel className={() => "fruit-heading"}>{group.label}</SearchSelectGroupLabel>
          <SearchSelectCollection>{(item: typeof items[number]) => <Item value={item} key={item.value}
            className={({ selected }) => selected ? "selected-row" : "ordinary-row"}>{item.label}</Item>}</SearchSelectCollection>
        </SearchSelectGroup>}
      </SearchSelectContent>
    </SearchSelect>);
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(await screen.findByRole("group", { name: "Orchard" })).toHaveClass("fruit-section");
    expect(input).toHaveClass("open-input", "text-lg");
    expect(document.querySelector("[data-slot=search-select-input-sizer]")).toHaveClass("open-input", "text-lg");
    await user.type(input, "ber");
    await waitFor(() => expect(screen.queryByRole("option", { name: "Apple" })).toBeNull());
    expect(screen.getByRole("group", { name: "Berries" })).toHaveClass("fruit-section");
    await user.keyboard("{Enter}");
    expect(change).toHaveBeenCalledWith(multiple ? [items[1]] : items[1], expect.anything());
    if (multiple) expect(screen.getByRole("option", { name: "Berry" })).toHaveClass("selected-row");
  });

  it.each(["select", "aligned", "search"] as const)("uses a custom portal and state-based popup classes (%s)", async (kind) => {
    const host = document.createElement("div");
    document.body.append(host);
    try {
      const popup = { portalProps: { container: host }, alignOffset: 12, className: ({ open }: { open: boolean }) => open ? "open-popup" : "closed-popup" };
      const { unmount } = render(kind === "select" ? <Select open><SelectTrigger aria-label="Fruit" /><SelectContent {...popup}><SelectItem value="apple">Apple</SelectItem></SelectContent></Select>
        : kind === "aligned" ? <AlignedSelect open><AlignedSelectTrigger aria-label="Fruit" /><AlignedSelectContent {...popup}><AlignedSelectItem value="apple">Apple</AlignedSelectItem></AlignedSelectContent></AlignedSelect>
          : <SearchSelect open items={items}><SearchSelectInput aria-label="Fruit" /><SearchSelectContent {...popup}>{(item: typeof items[number]) => <SearchSelectItem key={item.value} value={item}>{item.label}</SearchSelectItem>}</SearchSelectContent></SearchSelect>);
      expect(await within(host).findByRole("option", { name: "Apple" })).toBeInTheDocument();
      expect(host.querySelector(".open-popup")).not.toBeNull();
      expect(host.querySelector("[alignoffset],[portalprops]")).toBeNull();
      unmount();
    } finally { host.remove(); }
  });

  it.each(["select", "sort", "aligned", "search"] as const)("connects Field errors to the control and its class callback (%s)", (kind) => {
    const controlClass = ({ valid }: { valid: boolean | null }) => valid === false ? "invalid-field" : undefined;
    render(<Field.Root invalid>
      <Field.Label>Fruit</Field.Label>
      {kind === "select" || kind === "sort" ? <Select>
        {kind === "sort" ? <SelectSortTrigger label="Choose" className={controlClass} /> : <SelectTrigger className={controlClass} />}
        <SelectContent><SelectItem value="apple">Apple</SelectItem></SelectContent>
      </Select> : kind === "aligned" ? <AlignedSelect>
        <AlignedSelectTrigger className={controlClass} /><AlignedSelectContent><AlignedSelectItem value="apple">Apple</AlignedSelectItem></AlignedSelectContent>
      </AlignedSelect> : <SearchSelect items={items}>
        <SearchSelectInput className={controlClass} /><SearchSelectContent>{(item: typeof items[number]) => <SearchSelectItem value={item} key={item.value}>{item.label}</SearchSelectItem>}</SearchSelectContent>
      </SearchSelect>}
      <Field.Error match>Pick a fruit.</Field.Error>
    </Field.Root>);
    const control = screen.getByRole("combobox", { name: "Fruit" });
    expect(control).toHaveAttribute("data-invalid");
    expect(control).toHaveClass("invalid-field");
    expect(control).toHaveAccessibleDescription("Pick a fruit.");
  });

  it("evaluates aligned section and row classes as selection changes", async () => {
    const user = userEvent.setup();
    render(<AlignedSelect open defaultValue="apple">
      <AlignedSelectTrigger aria-label="Fruit" className={({ open }) => open ? "open-trigger" : undefined} />
      <AlignedSelectContent><AlignedSelectGroup className={() => "section"}>
        <AlignedSelectGroupLabel className={() => "heading"}>Fruit</AlignedSelectGroupLabel>
        {items.map((item) => <AlignedSelectItem key={item.value} value={item.value} className={({ selected }) => selected ? "selected-row" : undefined}>{item.label}</AlignedSelectItem>)}
      </AlignedSelectGroup></AlignedSelectContent>
    </AlignedSelect>);
    expect(screen.getByRole("combobox")).toHaveClass("open-trigger");
    expect(screen.getByRole("group", { name: "Fruit" })).toHaveClass("section");
    expect(screen.getByRole("option", { name: "Apple" })).toHaveClass("selected-row");
    await user.click(screen.getByRole("option", { name: "Berry" }));
    expect(screen.getByRole("option", { name: "Berry" })).toHaveClass("selected-row");
  });

  it("preserves custom input rendering and forwarded refs with state-based sizing", () => {
    const ref = createRef<HTMLInputElement>();
    const change = vi.fn();
    render(<SearchSelect items={items}><SearchSelectInput ref={ref} aria-label="Fruit" placeholder="Choose a fruit"
      className={({ focused }) => focused ? "text-lg" : "text-sm"} render={<input data-custom onChange={change} />} />
      <SearchSelectContent>{(item: typeof items[number]) => <SearchSelectItem key={item.value} value={item}>{item.label}</SearchSelectItem>}</SearchSelectContent>
    </SearchSelect>);
    const input = screen.getByRole("combobox");
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute("data-custom");
    fireEvent.change(input, { target: { value: "ber" } });
    expect(change).toHaveBeenCalledOnce();
  });
});
