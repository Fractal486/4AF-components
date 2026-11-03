import { Button } from "@/registry/ui/button/button";
import { Tooltip, TooltipGroup, TooltipProvider, TooltipTrigger } from "@/registry/ui/tooltip/tooltip";
import { bool, defineEntry, select, withIcons } from "../schema";
import { ANCHORED_ALIGN_ICONS, ANCHORED_SIDE_ICONS } from "../setting-icons";

const SIDES = ["top", "right", "bottom", "left"] as const;
const ALIGNS = ["start", "center", "end"] as const;

export const tooltipEntry = defineEntry({
  slug: "tooltip",
  name: "Tooltip",
  controls: {
    side: withIcons(select(SIDES, "top"), ANCHORED_SIDE_ICONS),
    align: withIcons(select(ALIGNS, "center"), ANCHORED_ALIGN_ICONS),
    trackCursorAxis: select(["none", "x", "y", "both"], "none", "Follow cursor"),
    shared: bool(false, "Shared tooltip"),
    disabled: bool(false, "Disabled"),
  },
  render({ side, align, trackCursorAxis, shared, disabled }) {
    const content = "Deploys to production";
    const delay = 200;
    if (shared) {
      return (
        <TooltipGroup side={side} align={align} delay={delay} trackCursorAxis={trackCursorAxis} disabled={disabled}>
          <div className="flex items-center gap-3">
            <TooltipTrigger content={content} render={<Button variant="outline" />}>Hover me</TooltipTrigger>
            <TooltipTrigger content="Preview deployment" render={<Button variant="outline" />}>And me</TooltipTrigger>
          </div>
        </TooltipGroup>
      );
    }
    return (
      // The Provider owns the delay and the grace window. Hover one button, then the
      // next within the grace period, and the second opens instantly.
      <TooltipProvider delay={delay} closeDelay={0}>
        <div className="flex items-center gap-3">
          <Tooltip content={content} side={side} align={align} trackCursorAxis={trackCursorAxis} disabled={disabled}>
            <Button variant="outline">Hover me</Button>
          </Tooltip>
          <Tooltip content="Preview deployment" side={side} align={align} trackCursorAxis={trackCursorAxis} disabled={disabled}>
            <Button variant="outline">And me</Button>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  },
});
