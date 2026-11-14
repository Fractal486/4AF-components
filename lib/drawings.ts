import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * A component's dimensional drawing, if it has one. Sources live in `public/drawings/`:
 * `<slug>.html` is the sheet and `<slug>-motion.mp4` its optional film.
 * `pnpm drawings:build` renders each sheet to the themed `content/drawings/<slug>.svg`.
 */
export interface ComponentDrawing {
  svg: string;
  sheetUrl: string;
  filmUrl?: string;
}

export function componentDrawing(slug: string): ComponentDrawing | undefined {
  const root = process.cwd();
  const svgPath = path.join(root, "content/drawings", `${slug}.svg`);
  if (!existsSync(svgPath)) return undefined;
  const film = `${slug}-motion.mp4`;
  return {
    svg: readFileSync(svgPath, "utf8"),
    sheetUrl: `/drawings/${slug}.html`,
    filmUrl: existsSync(path.join(root, "public/drawings", film)) ? `/drawings/${film}` : undefined,
  };
}
