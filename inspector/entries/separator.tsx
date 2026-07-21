import { Separator } from "@/registry/ui/separator/separator";
import { defineEntry, select } from "../schema";

const ORIENTATIONS = ["horizontal", "vertical"] as const;

export const separatorEntry = defineEntry({
  slug: "separator",
  name: "Separator",
  controls: {
    orientation: select(ORIENTATIONS, "horizontal"),
  },
  render({ orientation }) {
    if (orientation === "vertical") {
      return (
        <div className="flex h-8 items-center gap-4 text-sm text-muted-foreground">
          <span>Profile</span>
          <Separator orientation="vertical" />
          <span>Billing</span>
          <Separator orientation="vertical" />
          <span>Team</span>
        </div>
      );
    }

    return (
      <div className="flex w-full max-w-xs flex-col gap-3 text-sm text-muted-foreground">
        <span>Above the line</span>
        <Separator />
        <span>Below the line</span>
      </div>
    );
  },
});
