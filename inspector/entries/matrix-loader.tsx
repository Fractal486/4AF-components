import { MatrixLoader } from "@/registry/ui/matrix-loader/matrix-loader";
import { defineEntry, num, select } from "../schema";

export const matrixLoaderEntry = defineEntry({
  slug: "matrix-loader",
  name: "Matrix Loader",
  controls: {
    variant: select(["scan", "twinkle"], "scan", "Pattern"),
    size: select(["sm", "md", "lg"], "sm", "Size"),
    duration: num(1.2, { min: 0.4, max: 4, step: 0.1, label: "Cycle (seconds)" }),
  },
  render({ variant, size, duration }) {
    return (
      <MatrixLoader
        variant={variant}
        size={size}
        duration={duration}
        label="Loading"
      />
    );
  },
});
