import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import { vi } from "vitest";

const cleanScript = await readFile(path.resolve("scripts/clean-registry.mjs"), "utf8");
const fixtures: string[] = [];

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "4af-packaging-"));
  fixtures.push(root);
  return root;
}

async function put(root: string, file: string, data: string) {
  const target = path.join(root, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

afterEach(async () => {
  vi.restoreAllMocks();
  // These are only the fresh directories returned by mkdtemp in this test.
  await Promise.all(fixtures.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

it("publishes only the skill entry point and non-hidden Markdown references", async () => {
  const root = await fixture();
  const skill = path.join(root, ".agents/skills/4af-components");
  const allowed = ["SKILL.md", "references/catalog.md", "references/nested/guide.md"];
  const excluded = ["notes.md", ".env", "other/guide.md", "references/data.json",
    "references/.private.md", "references/.private/guide.md"];
  for (const file of [...allowed, ...excluded]) await put(skill, file, `Contents of ${file}`);

  vi.resetModules();
  const cwd = vi.spyOn(process, "cwd").mockReturnValue(root);
  const { GET } = await import("../app/api/agent-skill/download/route");
  cwd.mockRestore();
  const response = await GET();
  expect(response.headers.get("content-type")).toBe("application/zip");
  const zip = Buffer.from(await response.arrayBuffer());
  const entries = new Map<string, string>();
  let offset = 0;
  while (zip.readUInt32LE(offset) === 0x04034b50) {
    const method = zip.readUInt16LE(offset + 8);
    const size = zip.readUInt32LE(offset + 18);
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    const name = zip.subarray(offset + 30, offset + 30 + nameLength).toString();
    const start = offset + 30 + nameLength + extraLength;
    const data = zip.subarray(start, start + size);
    expect(entries.has(name)).toBe(false);
    expect([0, 8]).toContain(method);
    entries.set(name, (method === 8 ? inflateRawSync(data) : data).toString());
    offset = start + size;
  }
  expect([...entries.keys()].sort()).toEqual(allowed.map((file) => `4af-components/${file}`).sort());
  for (const file of allowed) expect(entries.get(`4af-components/${file}`)).toBe(`Contents of ${file}`);
});

it("cleans stale registry output only, from any working directory, and tolerates a missing output", async () => {
  const root = await fixture();
  await put(root, "scripts/clean-registry.mjs", cleanScript);
  await put(root, "public/r/removed.json", "old output");
  await put(root, "public/keep.txt", "keep");
  const clean = () => execFileSync(process.execPath, [path.join(root, "scripts/clean-registry.mjs")], { cwd: tmpdir() });
  clean();
  clean();
  expect(await readdir(path.join(root, "public"))).toEqual(["keep.txt"]);
  expect(await readFile(path.join(root, "public/keep.txt"), "utf8")).toBe("keep");
});

it("refuses to clean a registry directory redirected by a symlink or junction", async () => {
  const root = await fixture();
  await put(root, "scripts/clean-registry.mjs", cleanScript);
  await put(root, "private/keep.txt", "keep");
  await mkdir(path.join(root, "public"));
  await symlink(path.join(root, "private"), path.join(root, "public/r"), "junction");
  expect(() => execFileSync(process.execPath, [path.join(root, "scripts/clean-registry.mjs")], { stdio: "pipe" }))
    .toThrow(/Refusing to clean/);
  expect(await readFile(path.join(root, "private/keep.txt"), "utf8")).toBe("keep");
});
