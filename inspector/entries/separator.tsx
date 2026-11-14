import { Separator } from "@/registry/ui/separator/separator";
import { CalendarDays } from "lucide-react";
import { defineEntry, select, withIcons } from "../schema";
import { SEPARATOR_ALIGN_ICONS, SEPARATOR_ORIENTATION_ICONS } from "../setting-icons";

const ORIENTATIONS = ["horizontal", "vertical"] as const;

export const separatorEntry = defineEntry({
  slug: "separator",
  name: "Separator",
  controls: {
    orientation: withIcons(select(ORIENTATIONS, "horizontal"), SEPARATOR_ORIENTATION_ICONS),
    // Icon is the text label with an icon before it.
    label: select(["none", "text", "icon"], "none", "Label"),
    align: withIcons(select(["start", "center", "end"], "center", "Align", (values) => values.label === "none"), SEPARATOR_ALIGN_ICONS),
  },
  render({ orientation, label, align }) {
    const content = label === "none" ? undefined : <>{label === "icon" && <CalendarDays aria-hidden="true" />}Or</>;
    if (orientation === "vertical") {
      return (
        <div className={`flex w-full max-w-sm items-center gap-4 text-sm text-muted-foreground ${label !== "none" ? "min-h-40" : "min-h-8"}`}>
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
