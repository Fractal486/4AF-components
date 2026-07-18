import { Button } from "@/registry/ui/button/button";
import { Input } from "@/registry/ui/input/input";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/ui/popover/popover";
import { bool, defineEntry, select } from "../schema";

const SIDES = ["bottom", "top", "right", "left"] as const;

export const popoverEntry = defineEntry({
  slug: "popover",
  name: "Popover",
  controls: {
    side: select(SIDES, "bottom"),
    modal: bool(false, "Modal (trap focus)"),
  },
  render({ side, modal }) {
    return (
      <Popover modal={modal}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              // Stay pressed while the panel is open: `scale-95` sets the CSS `scale`
              // property (Tailwind v4), which composes with the transform Motion's press
              // writes — so it settles into the held depth as the press releases and
              // springs back on close. `PRESS_SCALE` is 0.95, so the two depths match.
              className="transition-[scale] duration-(--duration-base) ease-out data-[popup-open]:scale-95"
            >
              Dimensions
            </Button>
          }
        />
        <PopoverContent side={side}>
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
          </PopoverHeader>

          <div className="flex flex-col gap-2.5">
            {[
              ["Width", "100%"],
              ["Max. width", "300px"],
              ["Height", "25px"],
              ["Max. height", "none"],
            ].map(([label, value]) => (
              <label key={label} className="grid grid-cols-[5rem_1fr] items-center gap-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Input tone="accent" defaultValue={value} className="h-8" />
              </label>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <PopoverClose render={<Button size="sm">Done</Button>} />
          </div>
        </PopoverContent>
      </Popover>
    );
  },
});
