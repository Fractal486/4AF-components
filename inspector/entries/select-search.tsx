import { Alert } from "@/registry/ui/alert/alert";
import {
  SearchMultiSelectItem,
  SearchSelect,
  SearchSelectContent,
  SearchSelectInput,
  SearchSelectItem,
  SearchSelectGroup,
  SearchSelectGroupLabel,
  SearchSelectCollection,
} from "@/registry/ui/select/select-search";
import { FruitIcon } from "./select-fruit-icons";
import { bool, defineEntry, select, withIcons } from "../schema";
import { STATE_ICONS } from "../setting-icons";

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "blueberry", label: "Blueberry" },
  { value: "grape", label: "Grape" },
  { value: "mango", label: "Mango" },
  { value: "orange", label: "Orange" },
  { value: "strawberry", label: "Strawberry" },
  { value: "watermelon", label: "Watermelon" },
] as const;

/** Added when the demo is scrollable: enough rows that the panel outgrows its cap and scrolls. */
const MORE_FRUITS = [
  "Apricot", "Cherry", "Coconut", "Fig", "Guava", "Kiwi", "Lemon", "Lime", "Lychee", "Papaya",
  "Peach", "Pear", "Pineapple", "Plum", "Pomegranate", "Raspberry",
].map((label) => ({ value: label.toLowerCase(), label }));

const ALL_FRUITS = [...FRUITS, ...MORE_FRUITS].sort((a, b) => a.label.localeCompare(b.label));

type Fruit = { value: string; label: string };
type FruitGroup = { label: string; items: readonly Fruit[] };

function FruitOptions({ multiple, icons }: { multiple: boolean; icons: boolean }) {
  const Item = multiple ? SearchMultiSelectItem : SearchSelectItem;
  const row = (item: Fruit) => <Item key={item.value} value={item}
    icon={icons ? <FruitIcon value={item.value} /> : undefined}>{item.label}</Item>;
  return <SearchSelectContent emptyMessage="No fruit found.">
    {(item: Fruit | FruitGroup) => "items" in item ? (
      <SearchSelectGroup key={item.label} items={item.items}>
        <SearchSelectGroupLabel>{item.label}</SearchSelectGroupLabel>
        <SearchSelectCollection>{row}</SearchSelectCollection>
      </SearchSelectGroup>
    ) : row(item)}
  </SearchSelectContent>;
}

export const selectSearchEntry = defineEntry({
  slug: "select-search",
  name: "Select Search",
  controls: {
    variant: select(["default", "outline-ghost", "ghost", "plain"] as const, "default", "Variant"),
    // Focus tone colours the boxed looks' edge; ghost and plain have none.
    size: select(["sm", "md"] as const, "sm"),
    tone: select(["neutral", "accent"], "neutral", "Focus", (v) => v.variant === "ghost" || v.variant === "plain"),
    multiple: bool(false),
    selected: bool(true, "Selected"),
    icons: bool(true),
    groups: bool(false, "Sections"),
    scrollable: bool(false, "Scrollable"),
    state: withIcons(select(["default", "disabled", "invalid"] as const, "default", "State"), STATE_ICONS, { dropdown: true }),
  },
  render({ variant, size, tone, multiple, selected, scrollable, groups, icons, state }) {
    const disabled = state === "disabled";
    const invalid = state === "invalid";
    const items: readonly Fruit[] = scrollable ? ALL_FRUITS : FRUITS;
    const options = groups ? [
      { label: "Berries", items: items.filter((item) => item.value.endsWith("berry")) },
      { label: "Other fruit", items: items.filter((item) => !item.value.endsWith("berry")) },
    ] : items;
    return (
      <div className="w-full max-w-56">
        {multiple ? (
          <SearchSelect
            key={`multiple-${selected}`}
            multiple
            size={size}
            items={options}
            defaultValue={selected ? [FRUITS[1], FRUITS[4]] : []}
            disabled={disabled}
          >
            <SearchSelectInput
              variant={variant}
              aria-label="Fruits"
              placeholder="Select an option"
              tone={tone}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-search-error" : undefined}
            />
            <FruitOptions multiple icons={icons} />
          </SearchSelect>
        ) : (
          <SearchSelect<Fruit>
            key={`single-${selected}`}
            defaultValue={selected ? FRUITS[4] : null}
            size={size}
            items={options}
            disabled={disabled}
            iconForValue={icons ? (value) => <FruitIcon value={value.value} /> : undefined}
          >
            <SearchSelectInput
              variant={variant}
              aria-label="Fruit"
              placeholder="Select an option"
              tone={tone}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-search-error" : undefined}
            />
            <FruitOptions multiple={false} icons={icons} />
          </SearchSelect>
        )}
        {invalid && <Alert id="select-search-error">Please choose an option.</Alert>}
      </div>
    );
  },
});
