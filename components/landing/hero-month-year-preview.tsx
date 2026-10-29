import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { ChevronsUpDown } from "lucide-react";
import { Panel } from "./hero-preview-panel";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const years = [2023, 2024, 2025, 2026, 2027, 2028, 2029];
const pickerRow = "flex h-7 w-full shrink-0 items-center justify-center rounded-[5px] text-xs tabular-nums text-muted-foreground data-[checked]:bg-muted data-[checked]:font-medium data-[checked]:text-foreground";

/** Calendar's private month/year view, drawn in place like the hero's other open panels.
 * Fixed offsets show its selected rows without mounting the live picker's autofocus or
 * scrolling effects. The parent illustration makes the entire sample inert. */
export function MonthYearPreviewContent() {
  return (
      <div className="mx-auto w-59.5">
        <div className="mb-3 flex h-8.5 items-center justify-center gap-1 text-sm font-medium">
          October 2026<ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-1">
          {([
            { label: "Month", value: "October", options: months, offset: "-translate-y-51 py-7" },
            { label: "Year", value: 2026, options: years, offset: "" },
          ] as const).map(({ label, value, options, offset }) => (
            <div key={label} className="relative h-52.5 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_28px,black_calc(100%-28px),transparent)]">
              <RadioGroup aria-label={label} defaultValue={value} className={`flex flex-col gap-0.5 px-0.5 ${offset}`}>
                {options.map((option) => <Radio.Root key={option} value={option} className={pickerRow}>{option}</Radio.Root>)}
              </RadioGroup>
              <span className="pointer-events-none absolute inset-x-0 top-0 h-7 backdrop-blur-[1.5px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-7 backdrop-blur-[1.5px] [mask-image:linear-gradient(to_top,black,transparent)]" />
            </div>
          ))}
        </div>
      </div>
  );
}

export function MonthYearPreview() {
  return (
    <Panel name="month-year-picker" lift={6}>
      <MonthYearPreviewContent />
    </Panel>
  );
}
