import {
  HoverCard,
  HoverCardContent,
  HoverCardSkeleton,
  HoverCardTrigger,
} from "@/registry/ui/hover-card/hover-card";
import { bool, defineEntry, num, select } from "../schema";

const SIDES = ["bottom", "top", "right", "left"] as const;

export const hoverCardEntry = defineEntry({
  slug: "hover-card",
  name: "Hover Card",
  controls: {
    side: select(SIDES, "bottom"),
    delay: num(400, { min: 0, max: 1200, step: 100, label: "Open delay (ms)" }),
    loading: bool(false, "Loading"),
  },
  render({ side, delay, loading }) {
    return (
      <HoverCard>
        <HoverCardTrigger
          delay={delay}
          className="rounded-xs font-medium text-foreground underline decoration-border-strong decoration-1 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
          href="#"
          onClick={(event) => event.preventDefault()}
        >
          @alexmorgan
        </HoverCardTrigger>
        <HoverCardContent side={side} loading={loading} loadingContent={<HoverCardSkeleton />}>
          <div className="flex gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
            >
              AM
            </span>
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-foreground">Alex Morgan</p>
              <p className="text-muted-foreground">@alexmorgan</p>
              <p className="text-pretty text-muted-foreground">
                Product designer working on thoughtful, accessible interfaces.
              </p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  },
});
