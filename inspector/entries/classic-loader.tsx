import { ClassicLoader } from "@/registry/ui/classic-loader/classic-loader";
import { defineEntry, num, select } from "../schema";

export const classicLoaderEntry = defineEntry({
  slug: "classic-loader",
  name: "Classic Loader",
  controls: {
    size: select(["sm", "md", "lg"], "md", "Size"),
    speed: num(1, { min: 0.25, max: 4, step: 0.25, label: "Speed (×)" }),
    color: select(["foreground", "muted", "accent"], "foreground", "Color"),
  },
  render({ size, speed, color }) {
    const colors = {
      foreground: "text-foreground",
      muted: "text-muted-foreground",
      accent: "text-ring",
    };
    return (
      <ClassicLoader size={size} speed={speed} className={colors[color]} label="Loading" />
    );
  },
});
