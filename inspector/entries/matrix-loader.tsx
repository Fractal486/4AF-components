import { MatrixLoader } from "@/registry/ui/matrix-loader/matrix-loader";
import { defineEntry, select, withIcons } from "../schema";
import { MATRIX_GRID_ICONS, MATRIX_PATTERN_ICONS, MATRIX_SHAPE_ICONS } from "../setting-icons";

const PATTERNS = [
  "scan",
  "hash",
  "attention",
  "backprop",
  "beacon",
  "compile",
  "drift",
  "gradient-descent",
  "helix",
  "vector-index",
] as const;

export const matrixLoaderEntry = defineEntry({
  slug: "matrix-loader",
  name: "Matrix Loader",
  controls: {
    variant: withIcons(select(PATTERNS, "scan", "Pattern"), MATRIX_PATTERN_ICONS),
    grid: withIcons(select(["4×4", "5×5"], "4×4", "Grid"), MATRIX_GRID_ICONS),
    shape: withIcons(select(["square", "dot"], "square", "Shape"), MATRIX_SHAPE_ICONS),
    size: select(["sm", "md", "lg"], "sm", "Size"),
  },
  render({ variant, grid, shape, size }) {
    return (
      <MatrixLoader
        variant={variant}
        grid={grid === "5×5" ? 5 : 4}
        shape={shape}
        size={size}
        label="Loading"
      />
    );
  },
});
