import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(new URL("../out/", import.meta.url));
const markdownRoot = path.join(output, "llms.mdx", "docs");

// Next exports route responses at their internal URLs. Publish matching .md files
// so the existing public documentation URLs work without a server or rewrites.
async function publishMarkdown(directory, segments = []) {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    const nextSegments = [...segments, entry.name];
    if (entry.isDirectory()) {
      count += await publishMarkdown(source, nextSegments);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const destination = nextSegments.length === 1 && entry.name === "index.md"
        ? path.join(output, "docs.md")
        : path.join(output, "docs", ...nextSegments);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(source, destination);
      count += 1;
    }
  }
  return count;
}

const count = await publishMarkdown(markdownRoot);
if (count === 0) throw new Error("No Markdown documentation was exported.");
console.log(`Published ${count} static Markdown documents.`);
