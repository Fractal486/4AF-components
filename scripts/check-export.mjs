import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";
import { staticClient } from "fumadocs-core/search/client/orama-static";
import { componentReferences } from "../lib/component-reference.ts";
import { publicInstallCommand } from "../lib/site.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "out");
const preview = process.argv[2];
const read = (file) => readFile(path.join(output, file));

async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(file));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}

// Every source document must have both its public Markdown and its HTML page.
const docsRoot = path.join(root, "content", "docs");
const documents = (await filesIn(docsRoot)).filter((file) => file.endsWith(".mdx"));
for (const file of documents) {
  const slug = path.relative(docsRoot, file).replaceAll(path.sep, "/")
    .replace(/\.mdx$/, "").replace(/(^|\/)index$/, "");
  const url = slug ? `docs/${slug}` : "docs";
  assert.match((await read(`${url}.md`)).toString(), /^# /, `Markdown missing: ${url}`);
  assert.match((await read(slug ? `${url}.html` : "index.html")).toString(), /<html/, `HTML missing: ${url}`);
}
await read("404.html");

// Follow links in the published agent docs, where the archive's references/ folder
// and the site's MDX components aren't available to a Markdown reader.
const hostedSkill = "docs/reference/agent-skill/skill";
const hostedCatalog = "/docs/reference/agent-skill/component-catalog";
assert.ok((await read(`${hostedSkill}.html`)).toString().includes(`href="${hostedCatalog}"`));
assert.ok((await read(`${hostedSkill}.md`)).toString().includes(`[references/component-catalog.md](${hostedCatalog}.md)`));
for (const [page, firstCard] of [
  ["docs.md", "/docs/button.md"],
  ["docs/reference/agent-skill.md", "/docs/reference/agent-skill/skill.md"],
]) {
  const markdown = (await read(page)).toString();
  assert.doesNotMatch(markdown, /<\/?Cards?\b|\0/u, `${page}: unexpanded navigation cards`);
  const links = [...markdown.matchAll(/^- \[[^\]]+\]\((\/docs\/[^)]+\.md)\)/gmu)].map((match) => match[1]);
  assert.ok(links.includes(firstCard), `${page}: missing navigation link to ${firstCard}`);
  for (const href of links) await read(href.slice(1));
}

// Check the agent index's links and every published install item, including utilities.
const llms = (await read("llms.txt")).toString();
for (const match of llms.matchAll(/\]\((https:\/\/[^)]+\.md)\)/g)) {
  await read(new URL(match[1]).pathname.slice(1));
}
const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));
const exportedRegistry = JSON.parse(await read("r/registry.json"));
const itemNames = registry.items.map((item) => item.name).sort();
assert.deepEqual(exportedRegistry.items.map((item) => item.name).sort(), itemNames);
assert.deepEqual(
  (await readdir(path.join(output, "r"))).filter((file) => file.endsWith(".json")).sort(),
  [...itemNames, "registry"].map((name) => `${name}.json`).sort(),
  "Exported registry contains missing or stale items",
);
for (const item of registry.items) {
  const installed = JSON.parse(await read(`r/${item.name}.json`));
  assert.equal(installed.name, item.name);
  if (item.type === "registry:ui") {
    const markdown = (await read(`docs/${item.name}.md`)).toString();
    const install = `## Install\n\n\`\`\`bash\n${publicInstallCommand(item.name)}\n\`\`\``;
    const usage = `## Usage\n\n\`\`\`tsx\n${componentReferences[item.name].usage}\n\`\`\``;
    assert.ok(markdown.includes(install), `${item.name}: missing published install command`);
    assert.ok(markdown.includes(usage), `${item.name}: missing published usage example`);
  }
  for (const file of installed.files ?? []) {
    assert.ok(file.content, `${item.name}: missing ${file.path}`);
    assert.doesNotMatch(file.content, /\r/, `${item.name}: ${file.path} contains carriage returns`);
  }
}

// Exercise the same search client as the UI, directly against the exported index.
const searchIndex = await read("api/search");
const search = staticClient({ from: `data:application/json;base64,${searchIndex.toString("base64")}` });
for (const [query, expected] of [["Button", "/docs/button"], ["Select Search", "/docs/select-search"]]) {
  const results = await search.search(query);
  assert.ok(results.some((result) => result.url.split("#")[0] === expected), `No search result for ${query}`);
}

// Unpack the archive and compare it to the skill sources, rather than only checking a ZIP signature.
const archive = await read("api/agent-skill/download");
const archived = new Map();
let offset = 0;
while (archive.readUInt32LE(offset) === 0x04034b50) {
  const method = archive.readUInt16LE(offset + 8);
  const size = archive.readUInt32LE(offset + 18);
  const nameSize = archive.readUInt16LE(offset + 26);
  const extraSize = archive.readUInt16LE(offset + 28);
  const name = archive.subarray(offset + 30, offset + 30 + nameSize).toString();
  const start = offset + 30 + nameSize + extraSize;
  const data = archive.subarray(start, start + size);
  assert.ok(method === 0 || method === 8);
  assert.ok(!archived.has(name), `Duplicate archive entry: ${name}`);
  archived.set(name, method === 8 ? inflateRawSync(data) : data);
  offset = start + size;
}
const skillRoot = path.join(root, ".agents", "skills", "4af-components");
// Deliberately independent of the packager: every published file must be a named
// skill entry point or a non-hidden Markdown reference. Extra local files stay local.
const referenceNames = (await filesIn(path.join(skillRoot, "references")))
  .map((file) => path.relative(skillRoot, file).replaceAll(path.sep, "/"))
  .filter((file) => file.endsWith(".md") && !file.split("/").some((part) => part.startsWith(".")));
const skillNames = ["SKILL.md", ...referenceNames];
assert.deepEqual([...archived.keys()].sort(), skillNames.map((name) => `4af-components/${name}`).sort());
assert.match(archived.get("4af-components/SKILL.md").toString(), /\]\(references\/component-catalog\.md\)/u);
for (const name of skillNames) {
  assert.deepEqual(archived.get(`4af-components/${name}`), await readFile(path.join(skillRoot, name)), `Archive differs: ${name}`);
}

// Optionally check the actual Workers preview, including routing, caching and security headers.
if (preview) {
  const assertSecurityHeaders = (response, url) => {
    assert.equal(response.headers.get("x-content-type-options"), "nosniff", url);
    assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin", url);
    assert.equal(response.headers.get("content-security-policy"), "frame-ancestors 'none'", url);
  };
  for (const [url, type] of [
    ["/", "text/html"], ["/docs/button", "text/html"],
    ["/docs.md", "text/markdown"], ["/docs/button.md", "text/markdown"],
    ["/docs/reference/agent-skill/skill.md", "text/markdown"],
    ["/api/search", "application/json"], ["/api/agent-skill/download", "application/zip"],
    ["/llms.txt", "text/plain"], ["/r/button.json", "application/json"],
  ]) {
    const response = await fetch(new URL(url, preview));
    assert.equal(response.status, 200, url);
    assert.ok(response.headers.get("content-type")?.startsWith(type), `Wrong MIME type: ${url}`);
    assertSecurityHeaders(response, url);
    assert.doesNotMatch(response.headers.get("cache-control") ?? "", /immutable/i, `Mutable URL cached forever: ${url}`);
    if (url === "/api/agent-skill/download") {
      assert.match(response.headers.get("content-disposition") ?? "", /4af-components-skill\.zip/);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), archive);
    }
  }
  // Check real exported JS, CSS and font assets, not a guessed chunk name or a 404.
  const staticFiles = await filesIn(path.join(output, "_next", "static"));
  for (const extension of [".js", ".css", ".woff2"]) {
    const file = staticFiles.find((candidate) => candidate.endsWith(extension));
    assert.ok(file, `Missing static asset: ${extension}`);
    const url = `/${path.relative(output, file).replaceAll(path.sep, "/")}`;
    const response = await fetch(new URL(url, preview));
    assert.equal(response.status, 200, url);
    assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable", url);
    assertSecurityHeaders(response, url);
  }
  const redirect = await fetch(new URL("/docs", preview), { redirect: "manual" });
  assert.equal(redirect.status, 302);
  assert.equal(new URL(redirect.headers.get("location"), preview).pathname, "/");
  assert.equal((await fetch(new URL("/docs/this-page-does-not-exist", preview))).status, 404);
  const liveSearch = staticClient({ from: new URL("/api/search", preview).href });
  assert.ok((await liveSearch.search("Button")).some((result) => result.url === "/docs/button"));
}

console.log(`Export checks passed: ${documents.length} docs, ${registry.items.length} registry items, search, and skill ZIP${preview ? " (including Workers HTTP preview)" : ""}.`);
