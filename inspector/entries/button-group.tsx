import { Archive, Copy, Search, Share2, SquarePen, Trash2 } from "lucide-react";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { ButtonGroup } from "@/registry/ui/button-group/button-group";
import { DatePicker, DateRangePicker } from "@/registry/ui/date-picker/date-picker";
import { Input } from "@/registry/ui/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/ui/select/select";
import {
  AlignedSelect,
  AlignedSelectContent,
  AlignedSelectItem,
  AlignedSelectTrigger,
} from "@/registry/ui/select/select-aligned";
import { SearchSelect, SearchSelectContent, SearchSelectInput, SearchSelectItem } from "@/registry/ui/select/select-search";
import { CONTROL_VARIANTS, TEXT_SIZES } from "../button-options";
import { bool, defineEntry, multi, num, select } from "../schema";

const ACTIONS = [
  { label: "Copy", icon: Copy },
  { label: "Edit", icon: SquarePen },
  { label: "Share", icon: Share2 },
  { label: "Archive", icon: Archive },
  { label: "Delete", icon: Trash2 },
];
const SEARCH_ITEMS = [
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "marketing", label: "Marketing" },
];
const CONTENT = ["buttons", "input", "select", "alignedSelect", "searchSelect", "datePicker", "dateRangePicker"] as const;
const ICON_SIZE = { xs: "icon-xs", sm: "icon-sm", md: "icon", lg: "icon-lg" } as const;

function picks(values: Record<string, unknown>): readonly string[] {
  return Array.isArray(values.content) ? values.content : ["buttons"];
}

export const buttonGroupEntry = defineEntry({
  slug: "button-group",
  name: "Button Group",
  controls: {
    content: { ...multi(CONTENT, ["buttons"], "Content"), showCount: true },
    variant: select(CONTROL_VARIANTS, "outline"),
    size: select(TEXT_SIZES, "md", undefined, (values) => picks(values).includes("input")),
    orientation: select(["horizontal", "vertical"], "horizontal"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape", (values) => picks(values).some((item) => item !== "buttons")),
    count: num(3, { min: 1, max: 5, label: "Buttons", disabledWhen: (values) => !picks(values).includes("buttons") }),
    icon: select(["none", "leading", "only"], "leading", undefined, (values) => !picks(values).includes("buttons")),
    invalid: bool(false, "Invalid field", (values) => !picks(values).some((item) => item !== "buttons")),
  },
  render({ content, variant, size, orientation, shape, count, icon, invalid }) {
    const selected = Array.isArray(content) ? content : ["buttons"];
    const has = (kind: typeof CONTENT[number]) => selected.includes(kind);
    const hasFields = selected.some((item) => item !== "buttons");
    const iconOnly = icon === "only";
    // Inputs have one height; other fields support up to md, and SearchSelect starts at sm.
    const groupSize = has("input") ? "md"
      : hasFields && size === "lg" ? "md"
        : has("searchSelect") && size === "xs" ? "sm" : size;
    const fieldSize = groupSize === "lg" ? "md" : groupSize;

    if (selected.length === 0) {
      return <p className="text-sm text-muted-foreground">Select content to build a group.</p>;
    }

    return (
      <ButtonGroup
        variant={variant}
        size={groupSize}
        orientation={orientation}
        shape={hasFields ? "rectangular" : shape}
        aria-label="Button group preview"
        className={cn(
          (has("input") || has("searchSelect")) && "w-full max-w-3xl",
          orientation === "horizontal" && "min-w-max [&>[data-slot=input-wrapper]]:min-w-32",
        )}
      >
        {has("input") && (
          <Input aria-label="Query" placeholder="Search…" startIcon={<Search />} aria-invalid={invalid || undefined} />
        )}
        {has("select") && (
          <Select size={fieldSize} defaultValue="open">
            <SelectTrigger aria-label="Status" aria-invalid={invalid || undefined}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        )}
        {has("alignedSelect") && (
          <AlignedSelect size={fieldSize} defaultValue="day">
            <AlignedSelectTrigger aria-label="Group by" aria-invalid={invalid || undefined} />
            <AlignedSelectContent>
              <AlignedSelectItem value="day">Day</AlignedSelectItem>
              <AlignedSelectItem value="week">Week</AlignedSelectItem>
              <AlignedSelectItem value="month">Month</AlignedSelectItem>
            </AlignedSelectContent>
          </AlignedSelect>
        )}
        {has("searchSelect") && (
          <SearchSelect size={fieldSize === "xs" ? "sm" : fieldSize} items={SEARCH_ITEMS}>
            <SearchSelectInput aria-label="Team" placeholder="Team…" aria-invalid={invalid || undefined} />
            <SearchSelectContent>
              {(item: typeof SEARCH_ITEMS[number]) => <SearchSelectItem key={item.value} value={item}>{item.label}</SearchSelectItem>}
            </SearchSelectContent>
          </SearchSelect>
        )}
        {has("datePicker") && <DatePicker size={fieldSize} aria-label="Date" aria-invalid={invalid || undefined} />}
        {has("dateRangePicker") && <DateRangePicker size={fieldSize} aria-label="Date range" aria-invalid={invalid || undefined} />}
        {has("buttons") && ACTIONS.slice(0, count).map(({ label, icon: Icon }) => (
          <Button
            key={label}
            size={iconOnly ? ICON_SIZE[groupSize] : groupSize}
            aria-label={iconOnly ? label : undefined}
          >
            {icon !== "none" && <Icon />}
            {!iconOnly && label}
          </Button>
        ))}
      </ButtonGroup>
    );
  },
});
