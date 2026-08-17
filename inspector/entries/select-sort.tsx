import { ArrowUpDown, ListFilter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSortTrigger,
} from "@/registry/ui/select/select";
import { bool, defineEntry, select } from "../schema";

const FILTER_OPTIONS = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
} as const;

const SORT_OPTIONS = {
  updated: "Recently updated",
  name: "Name",
  created: "Recently created",
} as const;

export const selectSortEntry = defineEntry({
  slug: "select-sort",
  name: "Select and filter trigger",
  controls: {
    type: select(["sort", "filter"] as const, "sort", "Type"),
    size: select(["sm", "md"] as const, "sm", "Size"),
    multiple: bool(false, "Multiple selection"),
    selected: bool(true, "Selected"),
    outline: bool(true, "Outline"),
    showValue: bool(true, "Show value"),
    showLabel: bool(true, "Show label"),
  },
  render({ type, size, multiple, selected, outline, showValue, showLabel }) {
    const options = type === "filter" ? FILTER_OPTIONS : SORT_OPTIONS;
    const selectedValue = type === "filter" ? "active" : "updated";
    const triggerLabel = type === "filter" ? "Filter" : "Sort";
    const triggerIcon = type === "filter" ? <ListFilter /> : <ArrowUpDown />;
    const defaultValue = selected ? selectedValue : undefined;

    const trigger = (
      <SelectSortTrigger
        icon={triggerIcon}
        label={showLabel ? triggerLabel : undefined}
        outline={outline}
        showValue={showValue}
        aria-label={`${triggerLabel} projects`}
      />
    );
    const content = (
      <SelectContent
        width="content"
        clearable={type === "filter"}
        autoFocusFirstItem={false}
        className="min-w-40"
      >
        {Object.entries(options).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    );

    return (
      <div className="flex w-full items-center justify-center">
        {multiple ? (
          <Select<string, true>
            key={`${type}-${size}-${multiple}-${selected}`}
            multiple
            size={size}
            items={options}
            defaultValue={selected && defaultValue ? [defaultValue] : []}
          >
            {trigger}
            {content}
          </Select>
        ) : (
          <Select<string>
            key={`${type}-${size}-${multiple}-${selected}`}
            size={size}
            items={options}
            defaultValue={defaultValue}
          >
            {trigger}
            {content}
          </Select>
        )}
      </div>
    );
  },
});
