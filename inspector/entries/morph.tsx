import { LABEL_EFFECTS } from "../button-options";
import { bool, defineEntry, select } from "../schema";
import { MorphDemo } from "./morph.demo";

export const morphEntry = defineEntry({
  slug: "morph",
  name: "Morph",
  controls: {
    // Fixed sizing is shown by the icon, whose box is known.
    sizing: select(["widest", "current"], "widest", "Label sizing"),
    effect: select(LABEL_EFFECTS, "swap", "Label effect"),
    // The label's box, outlined so the sizing is visible.
    outline: bool(true, "Show box"),
  },
  render({ sizing, effect, outline }) {
    return <MorphDemo sizing={sizing} effect={effect} outline={outline} />;
  },
});
