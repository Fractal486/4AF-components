import { FieldError } from "@/registry/ui/field-error/field-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select-motion";
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

export const selectMotionEntry = defineEntry({
  slug: "select-motion",
  name: "Motion",
  controls: {
    size: select(["sm", "md"] as const, "sm"),
    disabled: bool(false),
    multiple: bool(false),
    searchable: bool(false, "Search in panel"),
    icons: bool(true),
    invalid: bool(false),
  },
  render({ size, disabled, multiple, searchable, icons, invalid }) {
    return (
      <div className="w-full max-w-56">
        {multiple ? (
          <Select key="multiple" multiple size={size} defaultValue={["banana", "mango"]} disabled={disabled}>
            <SelectTrigger
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-motion-error" : undefined}
            >
              <SelectValue placeholder="Pick fruits" />
            </SelectTrigger>
            <SelectContent
              searchable={searchable}
              searchPlaceholder="Search fruits…"
              emptyMessage="No fruit found."
            >
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
            size={size}
            defaultValue="banana"
            disabled={disabled}
            iconForValue={icons ? (value) => <FruitIcon value={value} /> : undefined}
          >
            <SelectTrigger
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-motion-error" : undefined}
            >
              <SelectValue placeholder="Pick a fruit" />
            </SelectTrigger>
            <SelectContent
              searchable={searchable}
              searchPlaceholder="Search fruits…"
              emptyMessage="No fruit found."
            >
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
        {invalid && <FieldError id="select-motion-error">Please choose an option.</FieldError>}
      </div>
    );
  },
});
