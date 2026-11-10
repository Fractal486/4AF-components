import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Claude's local discovery tree is generated, including on Windows without symlink privileges.
const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(root, ".agents", "skills");
const target = path.join(root, ".claude", "skills");
const check = process.argv.includes("--check");
if (process.argv.slice(2).some(arg => arg !== "--check")) throw new Error("Usage: node scripts/sync-skills.mjs [--check]");

function assertDirectory(directory) {
  const stat = lstatSync(directory, { throwIfNoEntry: false });
  if (!stat) return;
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Expected a real directory: ${directory}`);
}
for (const directory of [path.dirname(source), source, path.dirname(target), target]) assertDirectory(directory);

function files(directory, allowLinks = false, relative = "", result = new Map()) {
  if (!existsSync(directory)) return result;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      if (!allowLinks) throw new Error(`The canonical skill tree must contain files, not links: ${absolute}`);
      result.set(name, null);
    } else if (entry.isDirectory()) files(absolute, allowLinks, name, result);
    else if (entry.isFile()) result.set(name, readFileSync(absolute));
    else throw new Error(`Unsupported skill entry: ${absolute}`);
  }
  return result;
}

const expected = files(source);
if (!expected.size) throw new Error(`No canonical skills found at ${source}; leaving Claude's tree untouched.`);
const actual = files(target, true);
const matches = actual.size === expected.size && [...expected].every(([name, bytes]) => actual.get(name)?.equals(bytes));
if (check) {
  if (!matches) throw new Error("Claude's generated skills are missing or stale. Run pnpm skills:sync; edit only .agents/skills.");
  console.log(`Skill trees match (${expected.size} files).`);
} else if (matches) {
  console.log(`Claude skills already current (${expected.size} files).`);
} else {
  // Validate every removal against the fixed generated root. Never follow a junction:
  // two legacy skill directories were absolute junctions back into the canonical tree.
  function removeGenerated(entry) {
    const relative = path.relative(target, path.resolve(entry));
    if (!relative || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
      throw new Error(`Refusing to remove outside the generated skill tree: ${entry}`);
    }
    const stat = lstatSync(entry);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      for (const child of readdirSync(entry)) removeGenerated(path.join(entry, child));
      rmdirSync(entry);
    } else unlinkSync(entry);
  }
  mkdirSync(target, { recursive: true });
  for (const child of readdirSync(target)) removeGenerated(path.join(target, child));
  for (const name of expected.keys()) {
    const destination = path.join(target, name);
    mkdirSync(path.dirname(destination), { recursive: true });
    copyFileSync(path.join(source, name), destination);
  }
  console.log(`Generated ${expected.size} Claude skill files from .agents/skills.`);
}
