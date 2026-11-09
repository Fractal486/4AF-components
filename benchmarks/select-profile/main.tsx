import { Profiler } from "react";
import { createRoot } from "react-dom/client";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../registry/ui/select/select";

const stats = { renders: Array(500).fill(0), commits: [] as number[] };
Object.assign(window, { selectProfile: stats });
const items = Array.from({ length: 500 }, (_, index) => ({ value: index, label: `Option ${String(index).padStart(3, "0")}` }));
createRoot(document.getElementById("root")!).render(
  <Profiler id="select" onRender={(_id, _phase, actualDuration) => { stats.commits.push(actualDuration); }}>
    <Select items={items} defaultOpen>
      <SelectTrigger aria-label="Profile options" />
      <SelectContent searchable style={{ width: 300, background: "white" }}>
        {items.map(({ value, label }) => <SelectItem key={value} value={value}
          style={{ height: 26 }}
          className={() => { stats.renders[value] = (stats.renders[value] ?? 0) + 1; return ""; }}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  </Profiler>,
);
