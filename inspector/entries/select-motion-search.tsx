import { FieldError } from "@/registry/ui/field-error/field-error";
import {
  MotionSearchSelect,
  MotionSearchSelectContent,
  MotionSearchSelectInput,
  MotionSearchSelectItem,
  MotionSearchMultiSelectItem,
} from "@/registry/ui/select/select-motion-search";
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

export const selectMotionSearchEntry = defineEntry({
  slug: "select-motion-search",
  name: "Motion Search",
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
          <MotionSearchSelect
            key="multiple"
            multiple
            size={size}
            items={FRUITS}
            defaultValue={[FRUITS[1], FRUITS[4]]}
            disabled={disabled}
          >
            <MotionSearchSelectInput
              placeholder="Search fruits…"
              tone={tone}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-motion-search-error" : undefined}
            />
            <MotionSearchSelectContent emptyMessage="No fruit found.">
              {(item: Fruit) => (
                <MotionSearchMultiSelectItem
                  key={item.value}
                  value={item}
                  icon={icons ? <FruitIcon value={item.value} /> : undefined}
                >
                  {item.label}
                </MotionSearchMultiSelectItem>
              )}
            </MotionSearchSelectContent>
          </MotionSearchSelect>
        ) : (
          <MotionSearchSelect<Fruit>
            key="single"
            size={size}
            items={FRUITS}
            disabled={disabled}
            iconForValue={icons ? (value) => <FruitIcon value={value.value} /> : undefined}
          >
            <MotionSearchSelectInput
              placeholder="Search a fruit…"
              tone={tone}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? "select-motion-search-error" : undefined}
            />
            <MotionSearchSelectContent emptyMessage="No fruit found.">
              {(item: Fruit) => (
                <MotionSearchSelectItem
                  key={item.value}
                  value={item}
                  icon={icons ? <FruitIcon value={item.value} /> : undefined}
                >
                  {item.label}
                </MotionSearchSelectItem>
              )}
            </MotionSearchSelectContent>
          </MotionSearchSelect>
        )}
        {invalid && (
          <FieldError id="select-motion-search-error">Please choose an option.</FieldError>
        )}
      </div>
    );
  },
});
