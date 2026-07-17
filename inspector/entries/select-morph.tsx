import {
  MorphSelect,
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from "@/registry/ui/select/select-morph";
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

export const selectMorphEntry = defineEntry({
  slug: "select-morph",
  name: "Morph",
  controls: {
    disabled: bool(false),
  },
  render({ disabled }) {
    return (
      <div className="w-full max-w-56">
        <MorphSelect defaultValue="banana" disabled={disabled}>
          <MorphSelectTrigger>
            <MorphSelectValue placeholder="Pick a fruit" />
          </MorphSelectTrigger>
          <MorphSelectContent>
            {Object.entries(FRUITS).map(([value, label]) => (
              <MorphSelectItem key={value} value={value}>
                {label}
              </MorphSelectItem>
            ))}
          </MorphSelectContent>
        </MorphSelect>
      </div>
    );
  },
});
