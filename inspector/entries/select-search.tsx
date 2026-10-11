import { Alert } from "@/registry/ui/alert/alert";
import {
  SearchMultiSelectItem,
  SearchSelect,
  SearchSelectContent,
  SearchSelectInput,
  SearchSelectItem,
} from "@/registry/ui/select/select-search";
import { FruitIcon } from "./select-fruit-icons";
import { bool, defineEntry, select } from "../schema";

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

type Fruit = (typeof FRUITS)[number];

export const selectSearchEntry = defineEntry({
  slug: "select-search",
  name: "Select Search",
  controls: {
    size: select(["sm", "md"] as const, "sm"),
    tone: select(["neutral", "accent"], "neutral", "Focus"),
    disabled: bool(false),
    multiple: bool(false),
    icons: bool(true),
    invalid: bool(false),
  },
  render({ size, tone, disabled, multiple, icons, invalid }) {
    return (
      <div className="w-full max-w-56">
        {multiple ? (
          <SearchSelect
            key="multiple"
            multiple
            size={size}
            items={FRUITS}
            defaultValue={[FRUITS[1], FRUITS[4]]}
            disabled={disabled}
          >
            <SearchSelectInput
              aria-label="Fruits"
              placeholder="Search fruits…"
              tone={tone}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-search-error" : undefined}
            />
            <SearchSelectContent emptyMessage="No fruit found.">
              {(item: Fruit) => (
                <SearchMultiSelectItem
                  key={item.value}
                  value={item}
                  icon={icons ? <FruitIcon value={item.value} /> : undefined}
                >
                  {item.label}
                </SearchMultiSelectItem>
              )}
            </SearchSelectContent>
          </SearchSelect>
        ) : (
          <SearchSelect<Fruit>
            key="single"
            defaultValue={FRUITS[4]}
            size={size}
            items={FRUITS}
            disabled={disabled}
            iconForValue={icons ? (value) => <FruitIcon value={value.value} /> : undefined}
          >
            <SearchSelectInput
              aria-label="Fruit"
              placeholder="Search a fruit…"
              tone={tone}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-search-error" : undefined}
            />
            <SearchSelectContent emptyMessage="No fruit found.">
              {(item: Fruit) => (
                <SearchSelectItem
                  key={item.value}
                  value={item}
                  icon={icons ? <FruitIcon value={item.value} /> : undefined}
                >
                  {item.label}
                </SearchSelectItem>
              )}
            </SearchSelectContent>
          </SearchSelect>
        )}
        {invalid && <Alert id="select-search-error">Please choose an option.</Alert>}
      </div>
    );
  },
});
