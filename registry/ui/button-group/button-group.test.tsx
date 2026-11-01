import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { Button } from "@/registry/ui/button/button";
import { Input } from "@/registry/ui/input/input";
import { DatePicker } from "@/registry/ui/date-picker/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/ui/select/select";
import {
  AlignedSelect,
  AlignedSelectContent,
  AlignedSelectItem,
  AlignedSelectTrigger,
} from "@/registry/ui/select/select-aligned";
import {
  SearchSelect,
  SearchSelectContent,
  SearchSelectInput,
  SearchSelectItem,
} from "@/registry/ui/select/select-search";
import { ButtonGroup } from "./button-group";

describe("ButtonGroup", () => {
  it("keys the buttons it clones, so hand-written children don't warn", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ButtonGroup>
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );
    const keyWarnings = error.mock.calls.filter((call) => String(call[0]).includes('unique "key"'));
    error.mockRestore();
    expect(keyWarnings).toEqual([]);
  });

  it("flattens only the joined side of each button", () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>,
    );

    const [first, middle, last] = screen.getAllByRole("button");
    expect(first?.className).toContain("rounded-e-none");
    expect(first?.className).not.toContain("rounded-s-none");
    expect(middle?.className).toContain("rounded-none");
    expect(last?.className).toContain("rounded-s-none");
    expect(last?.className).not.toContain("rounded-e-none");
  });

  it("flattens buttons nested inside fragments", () => {
    render(
      <ButtonGroup>
        <>
          <Button>One</Button>
          <>
            <Button>Two</Button>
            {false && <Button>Hidden</Button>}
          </>
        </>
        <Button>Three</Button>
      </ButtonGroup>,
    );

    const [first, middle, last] = screen.getAllByRole("button");
    expect(first?.className).toContain("rounded-e-none");
    expect(middle?.className).toContain("rounded-none");
    expect(last?.className).toContain("rounded-s-none");
  });

  it("leaves a single button alone", () => {
    render(
      <ButtonGroup>
        <Button>Only</Button>
      </ButtonGroup>,
    );

    const button = screen.getByRole("button");
    expect(button.className).not.toContain("rounded-none");
    expect(button.className).not.toContain("border-s");
  });

  it("passes its variant and size down as defaults a child can still override", () => {
    render(
      <ButtonGroup variant="outline" size="sm">
        <Button>Inherits</Button>
        <Button variant="destructive">Own</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("button", { name: "Inherits" })).toHaveAttribute(
      "data-variant",
      "outline",
    );
    expect(screen.getByRole("button", { name: "Inherits" })).toHaveAttribute("data-size", "sm");
    expect(screen.getByRole("button", { name: "Own" })).toHaveAttribute(
      "data-variant",
      "destructive",
    );
  });

  it("matches its frame radius to the button size tier", () => {
    const { container, rerender } = render(
      <ButtonGroup size="sm">
        <Button>Small</Button>
        <Button>Button</Button>
      </ButtonGroup>,
    );

    const group = () => container.querySelector('[data-slot="button-group"]')!;
    expect(group()).toHaveClass("rounded-[6px]");

    rerender(
      <ButtonGroup size="md">
        <Button>Medium</Button>
        <Button>Button</Button>
      </ButtonGroup>,
    );

    expect(group()).toHaveClass("rounded-[8px]");
  });

  it("passes a pill shape down and rounds the group's outer ends to match", () => {
    render(
      <ButtonGroup shape="pill" variant="outline" aria-label="Pills">
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group", { name: "Pills" });
    const [first, middle, last] = screen.getAllByRole("button");
    expect(group).toHaveAttribute("data-shape", "pill");
    expect(group).toHaveClass("rounded-full");
    expect(first).toHaveAttribute("data-shape", "pill");
    expect(first).toHaveClass("rounded-full", "rounded-e-none");
    expect(middle).toHaveClass("rounded-none");
    expect(middle).not.toHaveClass("rounded-full");
    expect(last).toHaveClass("rounded-full", "rounded-s-none");
  });

  it("draws the outline once, on the group, and drops it on the buttons", () => {
    const { container } = render(
      <ButtonGroup variant="outline">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );

    const group = container.querySelector("[data-slot=button-group]");
    expect(group?.className).toContain("shadow-border");
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("shadow-none");
    }
  });

  it("frames a run whose outline comes from the buttons rather than the group", () => {
    const { container } = render(
      <ButtonGroup>
        <Button variant="outline">One</Button>
        <Button variant="outline">Two</Button>
      </ButtonGroup>,
    );

    expect(container.querySelector("[data-slot=button-group]")?.className).toContain(
      "shadow-border",
    );
  });

  it("draws no seam between quiet buttons, and one against a fill", () => {
    const { rerender } = render(
      <ButtonGroup variant="ghost">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );

    expect(screen.getAllByRole("button")[1]?.className).not.toContain("border-s");

    rerender(
      <ButtonGroup variant="primary">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );

    expect(screen.getAllByRole("button")[1]?.className).toContain("border-s");
  });

  it("moves the press to the label, so no seam opens while a button is held", () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );

    for (const button of screen.getAllByRole("button")) {
      expect(button.querySelector("[data-slot=button-content]")).not.toBeNull();
    }
  });

  it("hands a non-Button child the classes and none of the props", () => {
    render(
      <ButtonGroup variant="outline">
        <Button>One</Button>
        <a href="/docs">Docs</a>
      </ButtonGroup>,
    );

    const link = screen.getByRole("link", { name: "Docs" });
    expect(link.className).toContain("rounded-s-none");
    // `pressTarget` on an anchor would reach the DOM as an unknown attribute.
    expect(link).not.toHaveAttribute("pressTarget");
  });

  it("joins an Input as a field: framed, stretching, and without Button props", () => {
    render(
      <ButtonGroup variant="ghost" aria-label="Search">
        <Input aria-label="Query" />
        <Button>Search</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group", { name: "Search" });
    const input = screen.getByRole("textbox", { name: "Query" });
    const wrapper = input.closest('[data-slot="input-wrapper"]');
    expect(wrapper?.parentElement).toBe(group);
    expect(group.className).toContain("]:shadow-border");
    expect(matching(group, "flex-1")).toEqual([wrapper]);
    expect(matching(group, "rounded-e-none")).toEqual([input]);
    expect(matching(group, "rounded-s-none")).toEqual([]);
    expect(input).not.toHaveAttribute("pressTarget");
    expect(input).not.toHaveAttribute("variant");
  });

  it("moves the overlap to a wrapped Input's wrapper and styles the input inside", () => {
    const { container } = render(
      <ButtonGroup>
        <Button>Copy</Button>
        <Input aria-label="Link" startIcon={<svg />} />
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
    const wrapper = container.querySelector("[data-slot=input-wrapper]");
    const input = screen.getByRole("textbox", { name: "Link" });
    expect(wrapper?.parentElement).toBe(group);
    expect(matching(group, "-ms-px")).toEqual([wrapper]);
    expect(matching(group, "m-0")).toEqual([input]);
    expect(matching(group, "rounded-s-none")).toEqual([input]);
    expect(matching(group, "rounded-e-none")).toEqual([]);
  });

  it("treats a trigger followed only by its hidden form input as the last control", () => {
    render(
      <ButtonGroup>
        <Button>Filter</Button>
        <Select name="status" size="md" defaultValue="open">
          <SelectTrigger aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
          </SelectContent>
        </Select>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
    const trigger = screen.getByRole("combobox", { name: "Status" });
    expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    expect(trigger.nextElementSibling?.tagName).toBe("INPUT");
    expect(matching(group, "rounded-s-none")).toEqual([trigger]);
    expect(matching(group, "rounded-e-none")).toEqual([]);
  });

  it("joins AlignedSelect and DatePicker triggers", () => {
    render(
      <ButtonGroup>
        <AlignedSelect name="unit" defaultValue="day">
          <AlignedSelectTrigger aria-label="Unit" />
          <AlignedSelectContent>
            <AlignedSelectItem value="day">Day</AlignedSelectItem>
          </AlignedSelectContent>
        </AlignedSelect>
        <DatePicker name="from" aria-label="From" />
        <Button>Go</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
    const unit = screen.getByRole("combobox", { name: "Unit" });
    const from = screen.getByRole("button", { name: "From" });
    expect(matching(group, "flex-1")).toEqual([]);
    expect(matching(group, "flex-[0_0_max-content]")).toEqual([unit, from]);
    expect(matching(group, "w-auto")).toEqual([unit, from]);
    expect(matching(group, "rounded-e-none")).toEqual([unit, from]);
    expect(matching(group, "rounded-s-none")).toEqual([from]);
  });

  it("joins a SearchSelect through its wrapper, styling the input inside", () => {
    const items = [{ value: "ada", label: "Ada" }];
    const { container } = render(
      <ButtonGroup>
        <SearchSelect items={items} name="owner">
          <SearchSelectInput aria-label="Owner" />
          <SearchSelectContent>
            {(item: (typeof items)[number]) => (
              <SearchSelectItem key={item.value} value={item}>
                {item.label}
              </SearchSelectItem>
            )}
          </SearchSelectContent>
        </SearchSelect>
        <Button>Assign</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
    const field = container.querySelector("[data-slot=search-select-field]");
    const input = screen.getByRole("combobox", { name: "Owner" });
    expect(field?.parentElement).toBe(group);
    expect(input).toHaveAttribute("data-slot", "search-select-input");
    expect(matching(group, "flex-1")).toEqual([field]);
    expect(matching(group, "rounded-e-none")).toEqual([input]);
    expect(matching(group, "rounded-s-none")).toEqual([]);
  });

  it("uses the vertical edges when stacked", () => {
    render(
      <ButtonGroup orientation="vertical">
        <Input aria-label="Street" />
        <Input aria-label="City" />
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
    const city = screen.getByRole("textbox", { name: "City" });
    expect(matching(group, "-mt-px")).toEqual([city.closest('[data-slot="input-wrapper"]')]);
    expect(matching(group, "rounded-t-none")).toEqual([city]);
    expect(matching(group, "flex-1")).toEqual([]);
  });
});

/**
 * The elements a group's arbitrary-variant rule for `utility` selects, found by turning the
 * class back into its selector. Checks the selector logic itself, not just the class name.
 */
function matching(group: HTMLElement, utility: string) {
  const rule = group.className
    .split(/\s+/)
    .find((name) => name.startsWith("[") && name.endsWith(`]:${utility}`) && !name.includes(":not(:focus"));
  if (!rule) return [];
  const selector = rule.slice(1, -(utility.length + 2)).replaceAll("&", "[data-slot=button-group]");
  return [...group.parentElement!.querySelectorAll(selector)];
}
