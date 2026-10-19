import { Alert } from "@/registry/ui/alert/alert";
import {
  Select,
  SelectContent,
  SelectItem,
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

const NESTED_FRUITS = ["banana", "mango"] as const;

function FruitOptions({ icons }: { icons: boolean }) {
  return (
    <>
      {Object.entries(FRUITS)
        .filter(([value]) => !NESTED_FRUITS.includes(value as (typeof NESTED_FRUITS)[number]))
        .map(([value, label]) => (
          <SelectItem
            key={value}
            value={value}
            icon={icons ? <FruitIcon value={value} /> : undefined}
          >
            {label}
          </SelectItem>
        ))}
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
    size: select(["xs", "sm", "md"] as const, "sm"),
    disabled: bool(false),
    multiple: bool(false),
    selected: bool(true, "Selected"),
    searchable: bool(false, "Search in panel"),
    icons: bool(true),
    variant: select(["default", "ghost", "plain"] as const, "default", "Variant"),
    showLabel: bool(true, "Show label"),
    invalid: bool(false),
  },
  render({ size, disabled, multiple, selected, searchable, icons, variant, showLabel, invalid }) {
    return (
      <div className="w-full max-w-56">
        {multiple ? (
          <Select
            key={`multiple-${selected}`}
            multiple
            size={size}
            items={FRUITS}
            defaultValue={selected ? ["banana", "mango"] : []}
            disabled={disabled}
          >
            <SelectTrigger
              aria-label="Fruits"
              variant={variant}
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
              <FruitOptions icons={icons} />
            </SelectContent>
          </Select>
        ) : (
          <Select
            key={`single-${selected}`}
            size={size}
            items={FRUITS}
            defaultValue={selected ? "banana" : null}
            disabled={disabled}
            iconForValue={icons ? (value) => <FruitIcon value={String(value)} /> : undefined}
          >
            <SelectTrigger
              aria-label="Fruit"
              variant={variant}
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
              <FruitOptions icons={icons} />
            </SelectContent>
          </Select>
        )}
        {invalid && <Alert id="select-error">Please choose an option.</Alert>}
      </div>
    );
  },
});
