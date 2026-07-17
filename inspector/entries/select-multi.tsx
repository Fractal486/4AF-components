import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/registry/ui/select/select-multi";
import { bool, defineEntry } from "../schema";

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

export const selectMultiEntry = defineEntry({
  slug: "select-multi",
  name: "Multi",
  controls: {
    disabled: bool(false),
  },
  render({ disabled }) {
    return (
      <div className="w-full max-w-56">
        <MultiSelect defaultValue={["banana", "mango"]} disabled={disabled}>
          <MultiSelectTrigger aria-label="Fruit">
            <MultiSelectValue placeholder="Pick fruits" />
          </MultiSelectTrigger>
          <MultiSelectContent>
            {Object.entries(FRUITS).map(([value, label]) => (
              <MultiSelectItem key={value} value={value}>
                {label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </div>
    );
  },
});
