import { lstat, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Only the generated registry directory may be removed. Resolve from this script,
// not the caller's working directory, and refuse redirected filesystem paths.
const root = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const publicRoot = path.join(root, "public");
const target = path.resolve(publicRoot, "r");
if (await realpath(publicRoot) !== publicRoot || path.relative(root, target) !== path.join("public", "r")) {
  throw new Error("Refusing to clean a registry directory outside this project's public/r.");
}
const entry = await lstat(target).catch((error) => {
  if (error.code !== "ENOENT") throw error;
});
if (entry) {
  if (entry.isSymbolicLink() || !entry.isDirectory() || await realpath(target) !== target) {
    throw new Error("Refusing to clean public/r: expected a regular generated directory.");
  }
  await rm(target, { recursive: true });
}
