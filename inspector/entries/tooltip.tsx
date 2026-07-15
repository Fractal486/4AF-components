import { Button } from "@/registry/ui/button/button";
import { Tooltip, TooltipProvider } from "@/registry/ui/tooltip/tooltip";
import { defineEntry, num, select, text } from "../schema";

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
  },
  render({ side, align, content, delay }) {
    return (
      // The Provider owns the delay and the grace window. Hover one button, then the
      // next within the grace period, and the second opens instantly.
      <TooltipProvider delay={delay} closeDelay={0}>
        <div className="flex items-center gap-3">
          <Tooltip content={content} side={side} align={align}>
            <Button variant="outline">Hover me</Button>
          </Tooltip>
          <Tooltip content="Opens instantly — the grace window is still warm" side={side} align={align}>
            <Button variant="outline">And me</Button>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  },
});
