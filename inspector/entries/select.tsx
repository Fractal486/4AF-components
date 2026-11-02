import { Alert } from "@/registry/ui/alert/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectGroupLabel,
  SelectSub,
  SelectSubContent,
  SelectSubTrigger,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";
import { FruitIcon } from "./select-fruit-icons";
import { bool, defineEntry, select } from "../schema";

const FRUITS = {
  apple: "Apple",
  banana: "Banana",
  blueberry: "Blueberry",
  grape: "Grape",
  mango: "Mango",
  orange: "Orange",
  strawberry: "Strawberry",
  watermelon: "Watermelon",
} as const;

/** Added when the demo is scrollable: enough rows that the panel outgrows its cap and scrolls. */
const MORE_FRUITS = {
  apricot: "Apricot",
  cherry: "Cherry",
  coconut: "Coconut",
  fig: "Fig",
  guava: "Guava",
  kiwi: "Kiwi",
  lemon: "Lemon",
  lime: "Lime",
  lychee: "Lychee",
  papaya: "Papaya",
  peach: "Peach",
  pear: "Pear",
  pineapple: "Pineapple",
  plum: "Plum",
  pomegranate: "Pomegranate",
  raspberry: "Raspberry",
} as const;

const ALL_FRUITS = { ...FRUITS, ...MORE_FRUITS };

const NESTED_FRUITS = ["banana", "mango"] as const;

function FruitOptions({ icons, scrollable, groups }: { icons: boolean; scrollable: boolean; groups: boolean }) {
  const items = Object.entries(scrollable ? ALL_FRUITS : FRUITS)
    .sort(([, a], [, b]) => a.localeCompare(b))
    .filter(([value]) => !NESTED_FRUITS.includes(value as (typeof NESTED_FRUITS)[number]));
  const row = ([value, label]: [string, string]) => <SelectItem key={value} value={value}
    icon={icons ? <FruitIcon value={value} /> : undefined}>{label}</SelectItem>;
  return (
    <>
      {groups ? [true, false].map((berries) => <SelectGroup key={String(berries)}>
        <SelectGroupLabel>{berries ? "Berries" : "Other fruit"}</SelectGroupLabel>
        {items.filter(([value]) => value.endsWith("berry") === berries).map(row)}
      </SelectGroup>) : items.map(row)}
      <SelectSub>
        <SelectSubTrigger>More fruit</SelectSubTrigger>
        <SelectSubContent>
          {NESTED_FRUITS.map((value) => (
            <SelectItem
              key={value}
              value={value}
              icon={icons ? <FruitIcon value={value} /> : undefined}
            >
              {FRUITS[value]}
            </SelectItem>
          ))}
        </SelectSubContent>
      </SelectSub>
    </>
  );
}

export const selectEntry = defineEntry({
  slug: "select",
  name: "Select",
  controls: {
    variant: select(["default", "ghost", "plain"] as const, "default", "Variant"),
    tone: select(["neutral", "accent"] as const, "neutral", "Open border", (v) => v.variant !== "default"),
    size: select(["xs", "sm", "md"] as const, "sm"),
    multiple: bool(false),
    selected: bool(true, "Selected"),
    showLabel: bool(true, "Show label"),
    icons: bool(true),
    groups: bool(false, "Sections"),
    scrollable: bool(false, "Scrollable"),
    searchable: bool(false, "Search in panel"),
    state: select(["default", "disabled", "invalid"] as const, "default", "State"),
  },
  render({ size, multiple, selected, searchable, scrollable, groups, icons, variant, tone, showLabel, state }) {
    const disabled = state === "disabled";
    const invalid = state === "invalid";
    const items = scrollable ? ALL_FRUITS : FRUITS;
    return (
      <div className="w-full max-w-56">
        {multiple ? (
          <Select
            key={`multiple-${selected}`}
            multiple
            size={size}
            items={items}
            defaultValue={selected ? ["banana", "mango"] : []}
            disabled={disabled}
          >
            <SelectTrigger
              aria-label="Fruits"
              variant={variant}
              tone={tone}
              label={showLabel ? "Fruit" : undefined}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-error" : undefined}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent
              searchable={searchable}
              searchPlaceholder="Search fruits…"
              emptyMessage="No fruit found."
            >
              <FruitOptions icons={icons} scrollable={scrollable} groups={groups} />
            </SelectContent>
          </Select>
        ) : (
          <Select
            key={`single-${selected}`}
            size={size}
            items={items}
            defaultValue={selected ? "banana" : null}
            disabled={disabled}
            iconForValue={icons ? (value) => <FruitIcon value={String(value)} /> : undefined}
          >
            <SelectTrigger
              aria-label="Fruit"
              variant={variant}
              tone={tone}
              label={showLabel ? "Fruit" : undefined}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-error" : undefined}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent
              searchable={searchable}
              searchPlaceholder="Search fruits…"
              emptyMessage="No fruit found."
            >
              <FruitOptions icons={icons} scrollable={scrollable} groups={groups} />
            </SelectContent>
          </Select>
        )}
        {invalid && <Alert id="select-error">Please choose an option.</Alert>}
      </div>
    );
  },
});
