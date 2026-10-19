import { createRequire } from 'node:module';
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const [input, requestedOutput] = process.argv.slice(2);
if (!input || path.extname(input).toLowerCase() !== '.svg') {
  console.error('Usage: node render-preview.mjs <drawing.svg> [preview.png]');
  process.exit(1);
}
const source = path.resolve(input);
const output = path.resolve(requestedOutput ?? source.replace(/\.svg$/i, '.png'));
if (path.extname(output).toLowerCase() !== '.png') {
  throw new Error('The preview output must be a .png file.');
}

const requireProject = createRequire(path.join(process.cwd(), 'package.json'));
let sharp;
try {
  sharp = requireProject('sharp');
} catch {
  try {
    sharp = createRequire(requireProject.resolve('next/package.json'))('sharp');
  } catch {
    console.error('No local Sharp renderer found. Run from the project root or use an existing SVG renderer. The SVG needs no dependencies.');
    process.exit(1);
  }
}

const temporary = `${output}.${randomUUID()}.tmp`;
try {
  // Sharp renders the static SVG; the CSS animations only run in a browser.
  const png = await sharp(await readFile(source)).png().toBuffer();
  await writeFile(temporary, png, { flag: 'wx' });
  await rename(temporary, output);
  console.log(output);
} finally {
  await unlink(temporary).catch(error => {
    if (error.code !== 'ENOENT') throw error;
  });
}
