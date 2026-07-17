import {
  SearchSelect,
  SearchSelectContent,
  SearchSelectInput,
  SearchSelectItem,
} from "@/registry/ui/select/select-search";
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
  name: "Search",
  controls: {
    tone: select(["neutral", "accent"], "neutral", "Focus"),
    disabled: bool(false),
  },
  render({ tone, disabled }) {
    return (
      <div className="w-full max-w-56">
        <SearchSelect items={FRUITS} disabled={disabled}>
          <SearchSelectInput placeholder="Search a fruit…" tone={tone} />
          <SearchSelectContent emptyMessage="No fruit found.">
            {(item: Fruit) => (
              <SearchSelectItem key={item.value} value={item}>
                {item.label}
              </SearchSelectItem>
            )}
          </SearchSelectContent>
        </SearchSelect>
      </div>
    );
  },
});
