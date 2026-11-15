import { createHash } from "node:crypto";
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
  /** Where the sheet sits in the film's last frame: x, y, width, height in film pixels. */
  filmCrop?: FilmCrop;
}

export type FilmCrop = [x: number, y: number, width: number, height: number];

/** Written by scripts/measure-films.mjs after a film is rendered. */
let filmCrops: Record<string, FilmCrop> | undefined;

export function componentDrawing(slug: string): ComponentDrawing | undefined {
  const root = process.cwd();
  const svgPath = path.join(root, "content/drawings", `${slug}.svg`);
  if (!existsSync(svgPath)) return undefined;
  const film = `${slug}-motion.mp4`;
  const filmPath = path.join(root, "public/drawings", film);
  return {
    svg: readFileSync(svgPath, "utf8"),
    sheetUrl: `/drawings/${slug}.html`,
    // A re-rendered film keeps its file name; the content hash makes browsers fetch it anew.
    filmUrl: existsSync(filmPath) ? `/drawings/${film}?v=${contentHash(filmPath)}` : undefined,
    filmCrop: existsSync(filmPath) ? readFilmCrops(root)[slug] : undefined,
  };
}

function readFilmCrops(root: string) {
  const manifest = path.join(root, "content/drawings/films.json");
  filmCrops ??= existsSync(manifest) ? (JSON.parse(readFileSync(manifest, "utf8")) as Record<string, FilmCrop>) : {};
  return filmCrops;
}

function contentHash(file: string) {
  return createHash("sha1").update(readFileSync(file)).digest("hex").slice(0, 10);
}
