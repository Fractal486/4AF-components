import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const script = await readFile(path.resolve("scripts/sync-skills.mjs"), "utf8");
const fixtures: string[] = [];
async function put(root: string, name: string, text: string) {
  const file = path.join(root, name);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text);
}
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "4af-skill-sync-"));
  fixtures.push(root);
  await put(root, "scripts/sync-skills.mjs", script);
  await put(root, ".agents/skills/example/SKILL.md", "canonical");
  return { root, run: (...args: string[]) => execFileSync(process.execPath, [path.join(root, "scripts/sync-skills.mjs"), ...args], { cwd: tmpdir(), stdio: "pipe" }).toString() };
}
afterEach(async () => {
  for (const root of fixtures.splice(0)) {
    // Only remove fresh fixture roots returned by mkdtemp above.
    if (path.dirname(root) !== path.resolve(tmpdir()) || !path.basename(root).startsWith("4af-skill-sync-")) throw new Error("Unexpected fixture path");
    await rm(root, { recursive: true, force: true });
  }
});

it("generates all skill assets from any cwd and detects/removes stale copies", async () => {
  const { root, run } = await fixture();
  await put(root, ".agents/skills/example/references/guide.md", "guide");
  await put(root, ".agents/skills/example/assets/example.json", "{}");
  expect(() => run("--check")).toThrow(/pnpm skills:sync/);
  run();
  expect(run("--check")).toContain("3 files");
  expect(run()).toContain("already current");
  await put(root, ".claude/skills/obsolete/SKILL.md", "old");
  await put(root, ".agents/skills/example/SKILL.md", "updated");
  expect(() => run("--check")).toThrow(/stale/);
  run();
  expect(await readFile(path.join(root, ".claude/skills/example/SKILL.md"), "utf8")).toBe("updated");
  await expect(readFile(path.join(root, ".claude/skills/obsolete/SKILL.md"))).rejects.toMatchObject({ code: "ENOENT" });
  expect(run("--check")).toContain("3 files");
});

it("replaces legacy junctions without touching their canonical target", async () => {
  const { root, run } = await fixture();
  await mkdir(path.join(root, ".claude/skills"), { recursive: true });
  await symlink(path.join(root, ".agents/skills/example"), path.join(root, ".claude/skills/example"), process.platform === "win32" ? "junction" : "dir");
  run();
  expect(await readFile(path.join(root, ".agents/skills/example/SKILL.md"), "utf8")).toBe("canonical");
  expect(run("--check")).toContain("1 files");
});

it("refuses a generated root redirected outside the workspace", async () => {
  const { root, run } = await fixture();
  await put(root, "outside/keep.txt", "untouched");
  await mkdir(path.join(root, ".claude"));
  const link = path.join(root, ".claude/skills");
  await symlink(path.join(root, "outside"), link, process.platform === "win32" ? "junction" : "dir");
  expect(() => run()).toThrow(/Expected a real directory/);
  expect(await readFile(path.join(root, "outside/keep.txt"), "utf8")).toBe("untouched");
});
