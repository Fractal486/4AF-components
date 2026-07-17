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
    tone: select(["neutral", "accent"], "neutral", "Focus"),
    disabled: bool(false),
    multiple: bool(false),
    icons: bool(true),
  },
  render({ tone, disabled, multiple, icons }) {
    return (
      <div className="w-full max-w-56">
        {multiple ? (
          <MotionSearchSelect
            key="multiple"
            multiple
            items={FRUITS}
            defaultValue={[FRUITS[1], FRUITS[4]]}
            disabled={disabled}
          >
            <MotionSearchSelectInput placeholder="Search fruits…" tone={tone} />
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
            items={FRUITS}
            disabled={disabled}
            iconForValue={icons ? (value) => <FruitIcon value={value.value} /> : undefined}
          >
            <MotionSearchSelectInput placeholder="Search a fruit…" tone={tone} />
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
      </div>
    );
  },
});
