// Measures where each film's sheet border sits over its closing zoom-out, so the docs can crop
// the film to the sheet and keep the border in view from the moment it is drawn. Frames are read
// back from the end until the sheet no longer fits (still zooming in, or not drawn yet). Run after rendering a film: `node scripts/measure-films.mjs` (needs ffmpeg).
// Writes content/drawings/films.json: { slug: [x, y, width, height] } in 1920×1080 film pixels,
// with PAD pixels of paper kept around the border.
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = "public/drawings";
const W = 1920, H = 1080, INK = 225, PAD = 6;
const boxes = {};
function inkBox(file, seconds) {
  const frame = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-sseof", String(-seconds), "-i", path.join(dir, file),
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-s", `${W}x${H}`, "pipe:"], { maxBuffer: W * H * 2 });
  // A row or column counts once it holds a few dark pixels, so compression noise is ignored.
  const cols = new Uint32Array(W), rows = new Uint32Array(H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (frame[y * W + x] < INK) { cols[x]++; rows[y]++; }
  const first = (a) => a.findIndex((n) => n > 3);
  const last = (a) => a.length - 1 - [...a].reverse().findIndex((n) => n > 3);
  return [first(cols), first(rows), last(cols), last(rows)];
}

for (const file of readdirSync(dir).filter((f) => f.endsWith("-motion.mp4")).sort()) {
  const end = inkBox(file, 0.1);
  const box = [...end];
  for (let seconds = 0.35; seconds < 4; seconds += 0.25) {
    const [x0, y0, x1, y1] = inkBox(file, seconds);
    // Touching the frame, or more than a few percent larger or smaller than the final sheet: before the hold.
    const fits = x0 > 2 && y0 > 2 && x1 < W - 3 && y1 < H - 3 &&
      Math.abs((x1 - x0) - (end[2] - end[0])) < 0.035 * (end[2] - end[0]) &&
      Math.abs((y1 - y0) - (end[3] - end[1])) < 0.035 * (end[3] - end[1]);
    if (!fits) break;
    box[0] = Math.min(box[0], x0); box[1] = Math.min(box[1], y0);
    box[2] = Math.max(box[2], x1); box[3] = Math.max(box[3], y1);
  }
  const x0 = Math.max(0, box[0] - PAD), y0 = Math.max(0, box[1] - PAD);
  const x1 = Math.min(W - 1, box[2] + PAD), y1 = Math.min(H - 1, box[3] + PAD);
  boxes[file.replace("-motion.mp4", "")] = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}
writeFileSync("content/drawings/films.json", `${JSON.stringify(boxes, null, 2)}\n`);
console.log(`Measured ${Object.keys(boxes).length} films.`);
