import { Archive, ArrowUpDown, ListFilter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectSortTrigger,
  SelectSub,
  SelectSubContent,
  SelectSubTrigger,
} from "@/registry/ui/select/select";
import { bool, defineEntry, select } from "../schema";

const SORT_OPTIONS = {
  updated: "Recently updated",
  name: "Name",
  created: "Recently created",
} as const;

const FILTER_OPTIONS = {
  active: "Active",
  paused: "Paused",
  blocked: "Blocked",
  archived: "Archived",
  draft: "Draft",
  scheduled: "Scheduled",
} as const;

const NESTED_FILTER_OPTIONS = ["archived", "draft", "scheduled"] as const;

export const selectSortEntry = defineEntry({
  slug: "select-sort",
  name: "Sort / filter trigger",
  controls: {
    size: select(["xs", "sm", "md"] as const, "sm", "Size"),
    multiple: bool(false, "Multiple selection"),
    selected: bool(true, "Selected"),
    variant: select(["default", "ghost", "plain"] as const, "default", "Variant"),
    showValue: bool(true, "Show value"),
    showLabel: bool(true, "Show label"),
    footerAction: bool(false, "Footer action"),
  },
  render({ size, multiple, selected, variant, showValue, showLabel, footerAction }) {
    const options = multiple ? FILTER_OPTIONS : SORT_OPTIONS;
    const selectedValue = multiple ? "archived" : "updated";
    const triggerLabel = multiple ? "Filter" : "Sort";
    const triggerIcon = multiple ? <ListFilter /> : <ArrowUpDown />;
    const defaultValue = selected ? selectedValue : undefined;

    const trigger = (
      <SelectSortTrigger
        icon={triggerIcon}
        label={showLabel ? triggerLabel : undefined}
        variant={variant}
        showValue={showValue}
        aria-label={`${triggerLabel} projects`}
      />
    );
    const content = (
      <SelectContent
        clearable={multiple}
        // A button of the panel's own, sharing the footer row with the clear: an action on
        // the selection rather than one more thing to pick.
        footerActions={
          footerAction
            ? [
                {
                  key: "archive",
                  label: "Archive",
                  icon: <Archive />,
                  onSelect: () => undefined,
                },
              ]
            : undefined
        }
        autoFocusFirstItem={multiple}
        className={variant !== "plain" ? "min-w-40" : undefined}
      >
        {multiple ? (
          <>
            <SelectSub>
              <SelectSubTrigger>More statuses</SelectSubTrigger>
              <SelectSubContent>
                {NESTED_FILTER_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {FILTER_OPTIONS[value]}
                  </SelectItem>
                ))}
              </SelectSubContent>
            </SelectSub>
            <SelectSeparator />
            {Object.entries(options)
              .filter(([value]) => !NESTED_FILTER_OPTIONS.includes(value as (typeof NESTED_FILTER_OPTIONS)[number]))
              .map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
          </>
        ) : (
          Object.entries(options).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    );

    return (
      <div className="flex w-full items-center justify-center">
        {multiple ? (
          <Select<string, true>
            key={`${size}-${multiple}-${selected}`}
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
            key={`${size}-${multiple}-${selected}`}
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
