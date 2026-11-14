// Renders SVG icons to a PNG contact sheet: each icon at 4x (to judge the drawing) and at its
// real size (to judge legibility), on a dark and a light background.
//
//   node <skill>/scripts/render-icons.mjs <out.png> <icon.svg | directory>... [--size 16]
//
// Icons drawn with `currentColor` take the sheet's ink colour. Icons that live in JSX or another
// template can be written out as .svg files first (e.g. with react-dom/server's
// renderToStaticMarkup). Rasterises with Sharp, resolved from the current project.
import { createRequire } from "node:module";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const sizeIndex = args.indexOf("--size");
const size = sizeIndex >= 0 ? Number(args.splice(sizeIndex, 2)[1]) : 16;
const [output, ...inputs] = args;
if (!output?.endsWith(".png") || inputs.length === 0) {
  console.error("Usage: node render-icons.mjs <out.png> <icon.svg | directory>... [--size 16]");
  process.exit(1);
}

const requireProject = createRequire(path.join(process.cwd(), "package.json"));
const sharp = (() => {
  try {
    return requireProject("sharp");
  } catch {
    try {
      // Next.js ships Sharp for image optimisation.
      return createRequire(requireProject.resolve("next/package.json"))("sharp");
    } catch {
      console.error("No Sharp found. Run from a project that has `sharp` (or Next.js) installed.");
      process.exit(1);
    }
  }
})();

const files = [];
for (const input of inputs) {
  const entry = path.resolve(input);
  if ((await stat(entry)).isDirectory()) {
    for (const name of (await readdir(entry)).sort()) {
      if (name.endsWith(".svg")) files.push(path.join(entry, name));
    }
  } else {
    files.push(entry);
  }
}
if (files.length === 0) throw new Error("No .svg files found.");

const icons = await Promise.all(
  files.map(async (file) => ({
    name: path.basename(file, ".svg"),
    // Drop the XML prolog and any fixed size; the sheet places and sizes each copy.
    svg: (await readFile(file, "utf8"))
      .replace(/<\?xml[^>]*>/, "")
      .replace(/<svg([^>]*?)\s(?:width|height)="[^"]*"/g, "<svg$1")
      .replace(/<svg([^>]*?)\s(?:width|height)="[^"]*"/g, "<svg$1")
      .replace(/ class="[^"]*"/, ""),
  })),
);

const THEMES = [
  { ink: "#d4d4d2", ground: "#0b0b0b", label: "#8a8a86" },
  { ink: "#262624", ground: "#ffffff", label: "#77776f" },
];
const BIG = size * 4;
const COLUMNS = 6;
const CELL_W = Math.max(150, BIG + size + 60);
const CELL_H = BIG + 54;
const rows = Math.ceil(icons.length / COLUMNS);
const width = COLUMNS * CELL_W;
const height = rows * CELL_H;
const escape = (text) => text.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);

const cells = (theme, offsetY) =>
  icons
    .map(({ name, svg }, index) => {
      const x = (index % COLUMNS) * CELL_W;
      const y = offsetY + Math.floor(index / COLUMNS) * CELL_H;
      const big = svg.replace("<svg", `<svg x="${x + 16}" y="${y + 14}" width="${BIG}" height="${BIG}"`);
      const small = svg.replace(
        "<svg",
        `<svg x="${x + BIG + 36}" y="${y + 14 + (BIG - size) / 2}" width="${size}" height="${size}"`,
      );
      return `<g color="${theme.ink}">${big}${small}</g>` +
        `<text x="${x + 16}" y="${y + BIG + 36}" fill="${theme.label}" font-size="11" font-family="Segoe UI, Arial, sans-serif">${escape(name)}</text>`;
    })
    .join("");

const sheet =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height * 2}">` +
  THEMES.map((theme, index) =>
    `<rect y="${index * height}" width="${width}" height="${height}" fill="${theme.ground}"/>` + cells(theme, index * height),
  ).join("") +
  `</svg>`;

await writeFile(path.resolve(output), await sharp(Buffer.from(sheet)).png().toBuffer());
console.log(`${icons.length} icons → ${path.resolve(output)}`);
