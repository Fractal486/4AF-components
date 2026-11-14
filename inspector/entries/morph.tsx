import { bool, defineEntry, select } from "../schema";
import { MorphDemo } from "./morph.demo";

export const morphEntry = defineEntry({
  slug: "morph",
  name: "Morph",
  controls: {
    // Fixed sizing is shown by the icon, whose box is known.
    sizing: select(["widest", "current"], "widest", "Label sizing"),
    // The label's box, outlined so the sizing is visible.
    outline: bool(true, "Show box"),
  },
  render({ sizing, outline }) {
    return <MorphDemo sizing={sizing} outline={outline} />;
  },
});
