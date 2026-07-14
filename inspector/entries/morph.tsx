import { Menu, Moon, Pause, Play, Sun, X } from "lucide-react";
import { defineEntry, select } from "../schema";
import { IconToggle, TextToggle } from "./morph.demo";

const VARIANTS = ["primary", "outline", "ghost", "plain"] as const;

export const morphEntry = defineEntry({
  slug: "morph",
  name: "Morph",
  controls: {
    variant: select(VARIANTS, "outline"),
  },
  render({ variant }) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <IconToggle
            variant={variant}
            labels={["Play", "Pause"]}
            icons={[<Play key="play" />, <Pause key="pause" />]}
          />
          <IconToggle
            variant={variant}
            labels={["Open menu", "Close menu"]}
            icons={[<Menu key="menu" />, <X key="x" />]}
          />
          <IconToggle
            variant={variant}
            labels={["Dark theme", "Light theme"]}
            icons={[<Moon key="moon" />, <Sun key="sun" />]}
          />
        </div>
        <TextToggle variant={variant} labels={["Follow", "Following"]} />
      </div>
    );
  },
});
