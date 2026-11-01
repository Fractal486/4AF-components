import { Button } from "@/registry/ui/button/button";
import { Tooltip, TooltipGroup, TooltipProvider, TooltipTrigger } from "@/registry/ui/tooltip/tooltip";
import { bool, defineEntry, num, select, text } from "../schema";

const SIDES = ["top", "right", "bottom", "left"] as const;
const ALIGNS = ["start", "center", "end"] as const;

export const tooltipEntry = defineEntry({
  slug: "tooltip",
  name: "Tooltip",
  controls: {
    side: select(SIDES, "top"),
    align: select(ALIGNS, "center"),
    content: text("Deploys to production", "Content"),
    delay: num(200, { min: 0, max: 1000, step: 50, label: "Delay (ms)" }),
    trackCursorAxis: select(["none", "x", "y", "both"], "none", "Follow cursor"),
    shared: bool(false, "Shared tooltip"),
    disabled: bool(false, "Disabled"),
  },
  render({ side, align, content, delay, trackCursorAxis, shared, disabled }) {
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
