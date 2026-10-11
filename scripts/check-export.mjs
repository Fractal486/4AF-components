import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";
import { staticClient } from "fumadocs-core/search/client/orama-static";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "out");
const preview = process.argv[2];
const read = (file) => readFile(path.join(output, file));

async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(file));
    else files.push(file);
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
await read("full/sidebar-layout.html");

// Check the agent index's links and every published install item, including utilities.
const llms = (await read("llms.txt")).toString();
for (const match of llms.matchAll(/\]\((https:\/\/[^)]+\.md)\)/g)) {
  await read(new URL(match[1]).pathname.slice(1));
}
const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));
const exportedRegistry = JSON.parse(await read("r/registry.json"));
assert.equal(exportedRegistry.items.length, registry.items.length);
for (const item of registry.items) {
  const installed = JSON.parse(await read(`r/${item.name}.json`));
  assert.equal(installed.name, item.name);
  for (const file of installed.files ?? []) assert.ok(file.content, `${item.name}: missing ${file.path}`);
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
  archived.set(name, method === 8 ? inflateRawSync(data) : data);
  offset = start + size;
}
const skillRoot = path.join(root, ".agents", "skills", "4af-components");
const skillFiles = await filesIn(skillRoot);
assert.equal(archived.size, skillFiles.length);
for (const file of skillFiles) {
  const name = `4af-components/${path.relative(skillRoot, file).replaceAll(path.sep, "/")}`;
  assert.deepEqual(archived.get(name), await readFile(file), `Archive differs: ${name}`);
}

// Optionally check the actual Pages preview, including host routing and MIME headers.
if (preview) {
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
    if (url === "/api/agent-skill/download") {
      assert.match(response.headers.get("content-disposition") ?? "", /4af-components-skill\.zip/);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), archive);
    }
  }
  const redirect = await fetch(new URL("/docs", preview), { redirect: "manual" });
  assert.equal(redirect.status, 302);
  assert.equal(new URL(redirect.headers.get("location"), preview).pathname, "/");
  assert.equal((await fetch(new URL("/docs/this-page-does-not-exist", preview))).status, 404);
  const liveSearch = staticClient({ from: new URL("/api/search", preview).href });
  assert.ok((await liveSearch.search("Button")).some((result) => result.url === "/docs/button"));
}

console.log(`Export checks passed: ${documents.length} docs, ${registry.items.length} registry items, search, and skill ZIP${preview ? " (including Pages HTTP preview)" : ""}.`);
