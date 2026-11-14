// Renders each dimensional drawing sheet (`public/drawings/<slug>.html`) to a themed SVG at
// `content/drawings/<slug>.svg`, which the component's docs page inlines above its MDX.
//
// The sheets draw their SVG from a script and colour it with fixed greys. Running the script in
// jsdom captures the finished drawing; every grey is then rewritten as a mix of the site's
// foreground and background, so the drawing inverts with the theme. The sheet's title block and
// page chrome are left out: the docs page already carries the title.
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, "public/drawings");
const outDir = path.join(root, "content/drawings");

/** `#rgb` / `#rrggbb` → an ink/paper mix with the same lightness against #111 ink. */
function themedColor(hex) {
  const h = hex.length === 4 ? [...hex.slice(1)].map((c) => c + c).join("") : hex.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const value = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const ink = Math.round(Math.min(100, Math.max(0, ((255 - value) / (255 - 0x11)) * 100)));
  if (ink >= 100) return "var(--dw-ink)";
  if (ink <= 0) return "var(--dw-paper)";
  return `color-mix(in oklab, var(--dw-ink) ${ink}%, var(--dw-paper))`;
}

const themeColors = (css) => css.replace(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi, themedColor);

function render(slug, html) {
  const dom = new JSDOM(html, { runScripts: "dangerously" });
  const { document } = dom.window;
  const svg = document.querySelector("svg#sheet");
  if (!svg || !svg.childElementCount) throw new Error(`${slug}: no drawn svg#sheet`);

  const used = new Set([...svg.querySelectorAll("[class]")].flatMap((el) => [...el.classList]));
  const scope = `svg[data-drawing="${slug}"]`;
  const rules = [];
  const vars = [];
  // The raw text, not the CSSOM: jsdom drops shorthands such as `font: 400 11px var(--f)`.
  for (const style of document.querySelectorAll("style")) {
    const css = style.textContent.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");
    for (const [, selectorText, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selectors = selectorText.split(",").map((s) => s.trim());
      if (selectors.length === 1 && selectors[0] === ":root") {
        for (const decl of body.split(";")) {
          const [name, ...value] = decl.split(":");
          if (name?.trim().startsWith("--")) vars.push(`${name.trim()}:${themeColors(value.join(":").trim())}`);
        }
        continue;
      }
      // Only rules for the drawing's own classes; print and narrow-screen rules belong to the page.
      if (!selectors.every((s) => /^\.[\w-]+$/.test(s) && used.has(s.slice(1)))) continue;
      rules.push(`${selectors.map((s) => `${scope} ${s}`).join(",")}{${themeColors(body.trim())}}`);
    }
  }

  // Ids are unique within a page, and each docs page shows one drawing.
  for (const el of svg.querySelectorAll("[id]")) el.id = `${slug}-${el.id}`;
  for (const el of svg.querySelectorAll("*")) {
    for (const attr of [...el.attributes]) {
      if (attr.value.includes("url(#")) el.setAttribute(attr.name, attr.value.replaceAll("url(#", `url(#${slug}-`));
    }
  }
  const label = svg.querySelector("title")?.textContent;
  svg.removeAttribute("id");
  svg.removeAttribute("aria-labelledby");
  svg.setAttribute("data-drawing", slug);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (label) svg.setAttribute("aria-label", label);
  svg.querySelector("title")?.remove();
  svg.querySelector("desc")?.remove();

  const style = document.createElement("style");
  style.textContent = [
    `${scope}{--dw-ink:var(--foreground);--dw-paper:var(--background);${vars.join(";")}}`,
    ...rules,
  ].join("\n");
  svg.prepend(style);
  return `${svg.outerHTML}\n`;
}

const files = (await readdir(sourceDir)).filter((f) => f.endsWith(".html") && !f.endsWith("-motion.html"));
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
for (const file of files) {
  const slug = file.replace(/\.html$/, "");
  await writeFile(path.join(outDir, `${slug}.svg`), render(slug, await readFile(path.join(sourceDir, file), "utf8")));
  console.log(`drawing: ${slug}`);
}
