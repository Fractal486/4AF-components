import { Separator } from "@/registry/ui/separator/separator";
import { CalendarDays } from "lucide-react";
import { bool, defineEntry, select } from "../schema";

const ORIENTATIONS = ["horizontal", "vertical"] as const;

export const separatorEntry = defineEntry({
  slug: "separator",
  name: "Separator",
  controls: {
    orientation: select(ORIENTATIONS, "horizontal"),
    label: bool(false, "Label"),
    align: select(["start", "center", "end"], "center", "Align", (values) => !values.label),
    icon: bool(false, "Icon", (values) => !values.label),
  },
  render({ orientation, label, align, icon }) {
    const content = label ? <>{icon && <CalendarDays aria-hidden="true" />}Or</> : undefined;
    if (orientation === "vertical") {
      return (
        <div className={`flex w-full max-w-sm items-center gap-4 text-sm text-muted-foreground ${label ? "min-h-40" : "min-h-8"}`}>
          <span>Profile</span>
          <Separator orientation="vertical" label={content} align={align} className="min-w-0 data-[labeled]:flex-1" />
          <span>Billing</span>
        </div>
      );
    }

    return (
      <div className="flex w-full max-w-xs flex-col gap-3 text-sm text-muted-foreground">
        <span>Above the line</span>
        <Separator label={content} align={align} />
        <span>Below the line</span>
      </div>
    );
  },
});
