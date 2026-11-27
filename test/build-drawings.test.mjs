import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { buildDrawings } from "../scripts/build-drawings.mjs";

let root, source, output;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "4af-drawings-"));
  source = path.join(root, "sources");
  output = path.join(root, "output");
  await mkdir(source);
  await mkdir(output);
});
afterEach(() => rm(root, { recursive: true, force: true }));

const sheet = `<style>.hatch { fill: url( '#abc' ); stroke: #abc }</style>
  <svg id="sheet"><defs><pattern id="abc"></pattern></defs>
    <rect id="shape" class="hatch" style="fill:url(#abc)" stroke="url(#abc)"></rect>
    <use href="#shape"></use><use href="external.svg#shape"></use></svg>`;

it("scopes local references from styles, attributes and use elements", async () => {
  await writeFile(path.join(source, "example.html"), sheet);
  await writeFile(path.join(output, "obsolete.svg"), "old drawing");
  await writeFile(path.join(output, "films.json"), "{}");
  await buildDrawings(source, output);
  const svg = await readFile(path.join(output, "example.svg"), "utf8");
  expect(svg).toContain('id="example-abc"');
  expect(svg.match(/url\(#example-abc\)/g)).toHaveLength(3);
  expect(svg).toContain("stroke: color-mix(");
  expect(svg).toContain('href="#example-shape"');
  expect(svg).toContain('href="external.svg#shape"');
  expect((await readdir(output)).sort()).toEqual(["example.svg", "films.json"]);
});

it.each([
  [sheet.replace(" '#abc' ", "#missing"), "missing SVG target #missing"],
  [sheet.replace('href="#shape"', 'href="#missing"'), "missing SVG target #missing"],
  [sheet.replace('id="shape"', 'id="abc"'), "duplicate SVG id #abc"],
  [sheet + "<script>throw new Error('unfinished drawing')</script>", "drawing script failed"],
])("preserves previous files after a rendering error", async (invalid, message) => {
  await writeFile(path.join(source, "first.html"), sheet);
  await writeFile(path.join(source, "last.html"), invalid);
  await writeFile(path.join(output, "first.svg"), "previous drawing");
  await writeFile(path.join(output, "obsolete.svg"), "previous extra");
  await expect(buildDrawings(source, output)).rejects.toThrow(`last: ${message}`);
  expect((await readdir(output)).sort()).toEqual(["first.svg", "obsolete.svg"]);
  expect(await readFile(path.join(output, "first.svg"), "utf8")).toBe("previous drawing");
  expect(await readFile(path.join(output, "obsolete.svg"), "utf8")).toBe("previous extra");
});
