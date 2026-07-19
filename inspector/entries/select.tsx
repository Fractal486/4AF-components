import { FieldError } from "@/registry/ui/field-error/field-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";
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

export const selectEntry = defineEntry({
  slug: "select",
  name: "BaseUI",
  controls: {
    disabled: bool(false),
    multiple: bool(false),
    searchable: bool(false, "Search in panel"),
    icons: bool(true),
    outline: bool(true),
    invalid: bool(false),
  },
  render({ disabled, multiple, searchable, icons, outline, invalid }) {
    return (
      <div className="w-full max-w-56">
        {multiple ? (
          <Select
            key="multiple"
            multiple
            items={FRUITS}
            defaultValue={["banana", "mango"]}
            disabled={disabled}
          >
            <SelectTrigger
              aria-label="Fruits"
              outline={outline}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-error" : undefined}
            >
              <SelectValue placeholder="Pick fruits" />
            </SelectTrigger>
            <SelectContent
              width={outline ? "trigger" : "content"}
              searchable={searchable}
              searchPlaceholder="Search fruits…"
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
            items={FRUITS}
            defaultValue="banana"
            disabled={disabled}
            iconForValue={icons ? (value) => <FruitIcon value={String(value)} /> : undefined}
          >
            <SelectTrigger
              aria-label="Fruit"
              outline={outline}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-error" : undefined}
            >
              <SelectValue placeholder="Pick a fruit" />
            </SelectTrigger>
            <SelectContent
              width={outline ? "trigger" : "content"}
              searchable={searchable}
              searchPlaceholder="Search fruits…"
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
        {invalid && <FieldError id="select-error">Please choose an option.</FieldError>}
      </div>
    );
  },
});
