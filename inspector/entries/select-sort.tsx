import { ListFilter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSortTrigger,
} from "@/registry/ui/select/select";
import { bool, defineEntry } from "../schema";

const STATUS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
  { value: "completed", label: "Completed" },
] as const;

export const selectSortEntry = defineEntry({
  slug: "select-sort",
  name: "Select · Sort",
  controls: {
    outline: bool(true, "Outline"),
    showIcon: bool(true, "Icon"),
    showLabel: bool(true, "Label"),
    showValue: bool(true, "Value"),
    multiple: bool(false, "Multiple (filter)"),
  },
  render({ outline, showIcon, showLabel, showValue, multiple }) {
    // A sort/filter chip. Nothing selected by default, so it starts dashed ("Status: Any")
    // and turns solid once a choice is made — for `multiple`, it lists every pick.
    const trigger = (
      <SelectSortTrigger
        outline={outline}
        icon={showIcon ? <ListFilter /> : undefined}
        label={showLabel ? "Status" : undefined}
        showValue={showValue}
        aria-label="Filter by status"
      />
    );
    const content = (
      <SelectContent width="content" clearable>
        {STATUS.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    );

    // Remount when the mode flips so the single/multiple root resets cleanly.
    return multiple ? (
      <Select<string, true> key="multiple" multiple defaultValue={[]}>
        {trigger}
        {content}
      </Select>
    ) : (
      <Select<string> key="single">
        {trigger}
        {content}
      </Select>
    );
  },
});
