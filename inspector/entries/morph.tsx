import { Menu, Moon, Pause, Play, Sun, X } from "lucide-react";
import { CONTROL_VARIANTS } from "../button-options";
import { defineEntry, select } from "../schema";
import { IconToggle, TextToggle } from "./morph.demo";

export const morphEntry = defineEntry({
  slug: "morph",
  name: "Morph",
  controls: {
    variant: select(CONTROL_VARIANTS, "outline"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    sizing: select(["widest", "current"], "widest", "Width"),
  },
  render({ variant, shape, sizing }) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <IconToggle
            variant={variant}
            shape={shape}
            labels={["Play", "Pause"]}
            icons={[<Play key="play" />, <Pause key="pause" />]}
          />
          <IconToggle
            variant={variant}
            shape={shape}
            labels={["Open menu", "Close menu"]}
            icons={[<Menu key="menu" />, <X key="x" />]}
          />
          <IconToggle
            variant={variant}
            shape={shape}
            labels={["Dark theme", "Light theme"]}
            icons={[<Moon key="moon" />, <Sun key="sun" />]}
          />
        </div>
        <TextToggle
          variant={variant}
          shape={shape}
          sizing={sizing}
          labels={["Follow", "Following"]}
        />
      </div>
    );
  },
});
