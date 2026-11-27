// Renders each dimensional drawing sheet (`public/drawings/<slug>.html`) to a themed SVG at
// `content/drawings/<slug>.svg`, which the component's docs page inlines above its MDX.
//
// The sheets draw their SVG from a script and colour it with fixed greys. Running the script in
// jsdom captures the finished drawing; every grey is then rewritten as a mix of the site's
// foreground and background, so the drawing inverts with the theme. The sheet's title block and
// page chrome are left out: the docs page already carries the title.
import { mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";

const root = path.resolve(import.meta.dirname, "..");

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

// A paint server can have a hex-looking id, e.g. url(#abc). Only theme actual colors.
const themeColors = (css) => css.replace(/url\([^)]*\)|#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi,
  (value) => value.startsWith("#") ? themedColor(value) : value);

/** Area scale of one SVG `transform` attribute: √|det| of its matrix. */
function transformScale(value) {
  let scale = 1;
  for (const [, fn, args] of (value ?? "").matchAll(/(matrix|scale)\(([^)]*)\)/g)) {
    const n = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (fn === "matrix") scale *= Math.sqrt(Math.abs(n[0] * n[3] - n[1] * n[2]));
    else scale *= Math.sqrt(Math.abs(n[0] * (n[1] ?? n[0])));
  }
  return scale;
}

/**
 * Sheets keep exploded and enlarged strokes at a fixed screen width with `non-scaling-stroke`.
 * Inlined in the docs the drawing is scaled down — to a quarter on a phone — so those strokes
 * stayed full width while the rest shrank. Bake the intended width instead: the class's width
 * divided by the scale of every transform above the element, so it scales with the drawing.
 */
function bakeStrokes(svg, strokeWidths, nonScalingClasses) {
  for (const el of svg.querySelectorAll("*")) {
    const byAttribute = el.getAttribute("vector-effect") === "non-scaling-stroke";
    const byStyle = /vector-effect:\s*non-scaling-stroke/.test(el.getAttribute("style") ?? "");
    const byClass = [...el.classList].some((c) => nonScalingClasses.has(c));
    if (!byAttribute && !byStyle && !byClass) continue;
    el.removeAttribute("vector-effect");
    let style = (el.getAttribute("style") ?? "").replace(/vector-effect:\s*non-scaling-stroke\s*;?/g, "");
    let scale = 1;
    for (let node = el; node && node !== svg; node = node.parentElement) scale *= transformScale(node.getAttribute("transform"));
    if (Math.abs(scale - 1) > 1e-3) {
      const own = style.match(/stroke-width:\s*([\d.]+)/)?.[1] ?? el.getAttribute("stroke-width");
      const fromClass = [...el.classList].map((c) => strokeWidths.get(c)).find((w) => w !== undefined);
      const width = Number(own ?? fromClass ?? 1);
      style = style.replace(/stroke-width:\s*[\d.]+(px)?\s*;?/g, "");
      el.removeAttribute("stroke-width");
      style = `${style};stroke-width:${+(width / scale).toFixed(4)}`;
    }
    style = style.replace(/^;+|;+$/g, "").replace(/;;+/g, ";");
    if (style) el.setAttribute("style", style);
    else el.removeAttribute("style");
  }
}

function render(slug, html) {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: "none" });
  let scriptError;
  virtualConsole.on("jsdomError", (error) => {
    if (error.type === "unhandled-exception") scriptError ??= error;
    else console.error(error);
  });
  const dom = new JSDOM(html, { runScripts: "dangerously", virtualConsole });
  try {
    if (scriptError) throw new Error(`${slug}: drawing script failed`, { cause: scriptError.cause });
    return renderSheet(slug, dom.window.document);
  } finally {
    dom.window.close();
  }
}

function renderSheet(slug, document) {
  const svg = document.querySelector("svg#sheet");
  if (!svg || !svg.childElementCount) throw new Error(`${slug}: no drawn svg#sheet`);

  const used = new Set([...svg.querySelectorAll("[class]")].flatMap((el) => [...el.classList]));
  const scope = `svg[data-drawing="${slug}"]`;
  const rules = [];
  const vars = [];
  const strokeWidths = new Map();
  const nonScalingClasses = new Set();
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
      const width = body.match(/stroke-width:\s*([\d.]+)(?:px)?\s*(?:;|$)/);
      const nonScaling = /vector-effect:\s*non-scaling-stroke/.test(body);
      for (const s of selectors) {
        if (width) strokeWidths.set(s.slice(1), Number(width[1]));
        if (nonScaling) nonScalingClasses.add(s.slice(1));
      }
      const kept = body.replace(/vector-effect:\s*non-scaling-stroke\s*;?/g, "").trim();
      rules.push(`${selectors.map((s) => `${scope} ${s}`).join(",")}{${themeColors(kept)}}`);
    }
  }
  bakeStrokes(svg, strokeWidths, nonScalingClasses);

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
  prefixReferences(svg, slug);
  return `${svg.outerHTML}\n`;
}

function prefixReferences(svg, slug) {
  const ids = new Set();
  for (const el of svg.querySelectorAll("[id]")) {
    if (ids.has(el.id)) throw new Error(`${slug}: duplicate SVG id #${el.id}`);
    ids.add(el.id);
    el.id = `${slug}-${el.id}`;
  }
  function target(id) {
    if (!ids.has(id)) throw new Error(`${slug}: missing SVG target #${id}`);
    return `#${slug}-${id}`;
  }
  function paintUrls(value) {
    return value.replace(/url\(\s*(["']?)#([^\s'")]+)\1\s*\)/gi,
      (_url, _quote, id) => `url(${target(id)})`);
  }
  for (const el of [svg, ...svg.querySelectorAll("*")]) {
    if (el.localName === "style") el.textContent = paintUrls(el.textContent);
    for (const attr of el.attributes) {
      if (attr.localName === "href" && attr.value.startsWith("#")) attr.value = target(attr.value.slice(1));
      else if (/url\(/i.test(attr.value)) attr.value = paintUrls(attr.value);
    }
  }
}

export async function buildDrawings(sourceDir, outDir) {
  const sheets = (await readdir(sourceDir)).filter((name) => name.endsWith(".html") && !name.endsWith("-motion.html"));
  await mkdir(outDir, { recursive: true });
  const staging = await mkdtemp(path.join(outDir, ".drawings-"));
  const generated = new Set();
  try {
    // Finish rendering and writing every replacement before publishing any of them.
    for (const file of sheets) {
      const slug = path.basename(file, ".html");
      const name = `${slug}.svg`;
      const html = await readFile(path.join(sourceDir, file), "utf8");
      await writeFile(path.join(staging, name), render(slug, html));
      generated.add(name);
    }
    for (const name of generated) await rename(path.join(staging, name), path.join(outDir, name));
    // films.json and other non-SVG assets belong to other generators.
    for (const name of await readdir(outDir)) {
      if (name.endsWith(".svg") && !generated.has(name)) await rm(path.join(outDir, name));
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return generated.size;
}

if (import.meta.main) {
  const count = await buildDrawings(path.join(root, "public/drawings"), path.join(root, "content/drawings"));
  console.log(`Built ${count} drawings.`);
}
