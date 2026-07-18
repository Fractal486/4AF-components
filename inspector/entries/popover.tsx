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
        {/* `pressed` holds the trigger down for as long as the panel is open — the
            trigger's render function hands us Base UI's open state, so it's driven by the
            same source that controls the popover. One Motion spring owns the scale, so
            pressing the held button to dismiss doesn't compound or hitch on the way up. */}
        <PopoverTrigger
          render={(props, state) => (
            <Button {...props} variant="outline" pressed={state.open}>
              Dimensions
            </Button>
          )}
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
