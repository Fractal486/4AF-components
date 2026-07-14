import { Bell, Bold, Bookmark, Heart, Italic, Star, Underline } from "lucide-react";
import { Toggle } from "@/registry/ui/toggle/toggle";
import { bool, defineEntry, select } from "../schema";

const VARIANTS = ["ghost", "outline", "primary", "brand"] as const;

export const toggleEntry = defineEntry({
  slug: "toggle",
  name: "Toggle",
  summary: "A button that holds a state. The icon fills rather than swapping.",
  source: "Base UI Toggle, wearing Button's clothes.",
  controls: {
    variant: select(VARIANTS, "ghost"),
    size: select(["icon-sm", "icon", "icon-lg"], "icon"),
    fillIcon: bool(true, "Fill the icon when pressed"),
    defaultPressed: bool(false, "Start pressed"),
  },
  notes: [
    "A button *does* something; a toggle *is* something. That difference is `aria-pressed`, and it's the only thing telling a screen reader this control has an on/off state at all. Base UI owns it, so the styling and the ARIA are driven by the same attribute and can't drift apart.",
    "Nothing morphs here, on purpose. A bookmark has a filled counterpart — it's the same shape at a different weight, so there's nothing to swap *to*. Reach for Morph when the shape actually changes (play → pause); reach for a fill when it doesn't.",
    "The pop is what sells it. A fill that just appears reads as a re-render; a fill that swells and settles reads as something you did. The keyframe's duration is a token, so reduced-motion collapses it with everything else.",
    "It borrows Button's styles wholesale, so a Toggle sitting beside a Button is indistinguishable — which it should be. Same variants, same sizes, no second set to maintain.",
    "Uncontrolled by default (`defaultPressed`), controllable when you need it (`pressed` + `onPressedChange`).",
  ],
  render({ variant, size, fillIcon, defaultPressed }) {
    return (
      <div className="flex items-center gap-3">
        {[
          { icon: <Bookmark />, label: "Bookmark" },
          { icon: <Star />, label: "Star" },
          { icon: <Heart />, label: "Like" },
          { icon: <Bell />, label: "Notify" },
        ].map(({ icon, label }) => (
          <Toggle
            // Remounted when the settings change, so `defaultPressed` re-applies —
            // an uncontrolled component ignores a changed default otherwise.
            key={`${label}-${fillIcon}-${defaultPressed}-${variant}-${size}`}
            variant={variant}
            size={size}
            fillIcon={fillIcon}
            defaultPressed={defaultPressed}
            aria-label={label}
          >
            {icon}
          </Toggle>
        ))}
      </div>
    );
  },
  matrix() {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
            every variant
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {VARIANTS.map((variant) => (
              <Toggle key={variant} variant={variant} fillIcon aria-label="Bookmark">
                <Bookmark />
              </Toggle>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
            a toolbar, which is what these are usually for
          </span>
          <div className="flex w-fit items-center gap-0.5 rounded-lg bg-muted p-0.5">
            <Toggle aria-label="Bold" size="icon-sm">
              <Bold />
            </Toggle>
            <Toggle aria-label="Italic" size="icon-sm">
              <Italic />
            </Toggle>
            <Toggle aria-label="Underline" size="icon-sm">
              <Underline />
            </Toggle>
          </div>
        </div>
      </div>
    );
  },
});
