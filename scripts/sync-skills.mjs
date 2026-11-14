import { existsSync, lstatSync, mkdirSync, realpathSync, renameSync, symlinkSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// One directory link makes edits and newly added skills available immediately.
const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(root, ".agents", "skills");
const target = path.join(root, ".claude", "skills");
const check = process.argv.includes("--check");
if (process.argv.slice(2).some(arg => arg !== "--check")) throw new Error("Usage: node scripts/sync-skills.mjs [--check]");
for (const directory of [path.dirname(source), source, path.dirname(target)]) {
  const stat = lstatSync(directory, { throwIfNoEntry: false });
  if (!stat && directory === path.dirname(target)) continue;
  if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Expected a real directory: ${directory}`);
}
const current = lstatSync(target, { throwIfNoEntry: false });
const matches = current?.isSymbolicLink() && existsSync(target) && realpathSync(target) === realpathSync(source);
if (check) {
  if (!matches) throw new Error("Claude's skills link is missing or incorrect. Run pnpm skills:sync.");
  console.log("Claude skills link directly to .agents/skills.");
} else if (matches) {
  console.log("Claude skills link already current.");
} else {
  mkdirSync(path.dirname(target), { recursive: true });
  // Validate the fixed workspace target before moving the legacy tree.
  if (path.dirname(path.resolve(target)) !== path.resolve(root, ".claude")) throw new Error("Unexpected skills target.");
  if (current?.isSymbolicLink()) {
    unlinkSync(target); // Remove only the link; never traverse its target.
  } else if (current) {
    const backupRoot = path.resolve(root, "build", "skill-backups");
    for (const directory of [path.dirname(backupRoot), backupRoot]) {
      const stat = lstatSync(directory, { throwIfNoEntry: false });
      if (stat && (stat.isSymbolicLink() || !stat.isDirectory())) throw new Error(`Expected a real backup directory: ${directory}`);
    }
    mkdirSync(backupRoot, { recursive: true });
    const backup = path.join(backupRoot, `claude-skills-${Date.now()}`);
    if (path.dirname(backup) !== backupRoot) throw new Error("Invalid backup path.");
    renameSync(target, backup); // Preserve copies and any local edits.
    console.log(`Preserved previous copies at ${path.relative(root, backup)}.`);
  }
  symlinkSync(process.platform === "win32" ? source : path.relative(path.dirname(target), source), target,
    process.platform === "win32" ? "junction" : "dir");
  if (realpathSync(target) !== realpathSync(source)) throw new Error("Skills link verification failed.");
  console.log("Linked .claude/skills to .agents/skills.");
}
