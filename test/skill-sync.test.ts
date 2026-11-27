import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
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

it("links the canonical directory from any cwd and exposes new and edited files immediately", async () => {
  const { root, run } = await fixture();
  await put(root, ".agents/skills/example/references/guide.md", "guide");
  await put(root, ".agents/skills/example/assets/example.json", "{}");
  expect(() => run("--check")).toThrow(/pnpm skills:sync/);
  run();
  expect(await realpath(path.join(root, ".claude/skills"))).toBe(await realpath(path.join(root, ".agents/skills")));
  run("--check");
  expect(run()).toContain("already current");
  await put(root, ".agents/skills/new/SKILL.md", "new");
  await put(root, ".agents/skills/example/SKILL.md", "updated");
  expect(await readFile(path.join(root, ".claude/skills/example/SKILL.md"), "utf8")).toBe("updated");
  expect(await readFile(path.join(root, ".claude/skills/new/SKILL.md"), "utf8")).toBe("new");
  run("--check");
});

it("backs up legacy copies and junctions before linking the root", async () => {
  const { root, run } = await fixture();
  await mkdir(path.join(root, ".claude/skills"), { recursive: true });
  await put(root, ".claude/skills/local/SKILL.md", "local edits");
  await symlink(path.join(root, ".agents/skills/example"), path.join(root, ".claude/skills/example"), process.platform === "win32" ? "junction" : "dir");
  run();
  expect(await readFile(path.join(root, ".agents/skills/example/SKILL.md"), "utf8")).toBe("canonical");
  const backups = path.join(root, "build/skill-backups");
  const names = await readdir(backups);
  expect(names).toHaveLength(1);
  expect(await readFile(path.join(backups, names[0]!, "local/SKILL.md"), "utf8")).toBe("local edits");
  run("--check");
});

it("repairs a wrong link without modifying its target", async () => {
  const { root, run } = await fixture();
  await put(root, "outside/keep.txt", "untouched");
  await mkdir(path.join(root, ".claude"));
  const link = path.join(root, ".claude/skills");
  await symlink(path.join(root, "outside"), link, process.platform === "win32" ? "junction" : "dir");
  expect(() => run("--check")).toThrow(/pnpm skills:sync/);
  run();
  expect(await realpath(link)).toBe(await realpath(path.join(root, ".agents/skills")));
  expect(await readFile(path.join(root, "outside/keep.txt"), "utf8")).toBe("untouched");
  run("--check");
});
