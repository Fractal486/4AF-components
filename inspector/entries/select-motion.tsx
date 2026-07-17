import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select-motion";
import { FruitIcon } from "./select-fruit-icons";
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

export const selectMotionEntry = defineEntry({
  slug: "select-motion",
  name: "Motion",
  controls: {
    disabled: bool(false),
    multiple: bool(false),
    icons: bool(true),
  },
  render({ disabled, multiple, icons }) {
    return (
      <div className="w-full max-w-56">
        {multiple ? (
          <Select key="multiple" multiple defaultValue={["banana", "mango"]} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Pick fruits" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FRUITS).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  icon={icons ? <FruitIcon value={value} /> : undefined}
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select
            key="single"
            defaultValue="banana"
            disabled={disabled}
            iconForValue={icons ? (value) => <FruitIcon value={value} /> : undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a fruit" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FRUITS).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  icon={icons ? <FruitIcon value={value} /> : undefined}
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  },
});
