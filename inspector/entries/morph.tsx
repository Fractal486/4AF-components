import { Menu, Moon, Pause, Play, Sun, X } from "lucide-react";
import { defineEntry, select } from "../schema";
import { IconToggle, TextToggle } from "./morph.demo";

const STYLES = ["pop", "fade", "lift"] as const;
const FEELS = ["clean", "snappy", "smooth", "bouncy", "gentle"] as const;

export const morphEntry = defineEntry({
  slug: "morph",
  name: "Morph",
  summary: "Swaps one piece of content for another. Icons or text — it doesn't care.",
  source: "Animate UI — generalised out of a copy button, wired to the spring presets.",
  controls: {
    style: select(STYLES, "pop"),
    feel: select(FEELS, "clean"),
  },
  notes: [
    "The outgoing content shrinks and blurs away while the incoming one resolves into focus — they cross over, they don't queue. That overlap is why this needs Motion: React wants to unmount the old content the instant state changes, and AnimatePresence is what keeps it alive long enough to leave.",
    "Watch the text button's width: it doesn't change. 'Follow' and 'Following' are different widths, but Morph is given both, so it reserves the width of the longer one and holds it in both states. A control that resizes under the cursor moves the target — and animating that resize only makes it move smoothly, which is still moving. Icons never expose this; they're all one size.",
    "Press twice quickly. The animation reverses mid-flight instead of restarting, because a spring absorbs a new target while it's still moving. A duration-based tween would snap back to the start.",
    "Under `prefers-reduced-motion` the swap is instant — not a fast version of the animation. A spring with a near-zero duration doesn't settle, it snaps.",
    "`fade` is the restrained option and usually right in dense UI. `lift` implies direction, so it suits sequences (and text) more than a toggle.",
    "It isn't tied to Button. It's a content swap, so it works anywhere content changes.",
  ],
  render({ style, feel }) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <IconToggle
            style={style}
            feel={feel}
            labels={["Play", "Pause"]}
            icons={[<Play key="play" />, <Pause key="pause" />]}
          />
          <IconToggle
            style={style}
            feel={feel}
            labels={["Open menu", "Close menu"]}
            icons={[<Menu key="menu" />, <X key="x" />]}
          />
          <IconToggle
            style={style}
            feel={feel}
            labels={["Dark theme", "Light theme"]}
            icons={[<Moon key="moon" />, <Sun key="sun" />]}
          />
        </div>
        <TextToggle style={style} feel={feel} labels={["Follow", "Following"]} />
      </div>
    );
  },
  matrix() {
    return (
      <div className="flex flex-col gap-6">
        {STYLES.map((style) => (
          <div key={style} className="flex flex-col gap-2">
            <span className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
              {style}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {FEELS.map((feel) => (
                <div key={feel} className="flex items-center gap-2">
                  <IconToggle
                    style={style}
                    feel={feel}
                    labels={["Play", "Pause"]}
                    icons={[<Play key="play" />, <Pause key="pause" />]}
                  />
                  <span className="font-mono text-2xs text-subtle-foreground">{feel}</span>
                </div>
              ))}
              <TextToggle style={style} feel="clean" labels={["Follow", "Following"]} />
            </div>
          </div>
        ))}
      </div>
    );
  },
});
