import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const { createServer } = await import(pathToFileURL(require.resolve('vite', { paths: [path.dirname(require.resolve('vitest/package.json'))] })).href);
const server = await createServer({
  root: path.join(root, 'benchmarks/select-profile'), configFile: false,
  resolve: { alias: { '@': root } },
  oxc: { jsx: { runtime: 'automatic' } },
  server: { host: '127.0.0.1', port: 4317, strictPort: true, fs: { allow: [root] } },
});
await server.listen();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = { browser: browser.version(), options: 500, samples: [] };
  for (let run = 0; run < 3; run++) {
    const page = await browser.newPage({ viewport: {width: 1000, height: 900}, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:4317/index.html');
    await page.getByRole('option', {name:'Option 000', exact:true}).waitFor();
    const settle = () => page.evaluate(() => new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await settle();
    const measure = async (name, action) => {
      await page.evaluate(()=>{ window.selectProfile.renders.fill(0); window.selectProfile.commits.length=0; });
      await action();
      await settle();
      return { name, ...await page.evaluate(()=>({
        rowRenders: window.selectProfile.renders.reduce((a,b)=>a+b,0),
        rowsRendered: window.selectProfile.renders.filter(Boolean).length,
        commitMs: window.selectProfile.commits.reduce((a,b)=>a+b,0),
        commits: window.selectProfile.commits.length,
      })) };
    };
    const samples = [];
    // Warm pointer/focus handling before measuring a move between two rows.
    await page.getByRole('option', {name:'Option 001', exact:true}).hover();
    await settle();
    samples.push(await measure('hover', ()=>page.getByRole('option', {name:'Option 002', exact:true}).hover()));
    const search = page.getByRole('textbox', {name:'Search options'});
    samples.push(await measure('search-all-match', ()=>search.fill('Option')));
    samples.push(await measure('search-one-match', ()=>search.fill('Option 499')));
    assert.equal(await page.getByRole('option').count(), 1);
    assert.deepEqual(errors, []);
    report.samples.push(samples);
    await page.close();
  }
  await writeFile(process.argv[2] ?? path.join(root, 'benchmarks/select-profile-latest.json'), JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
} finally {
  await browser?.close();
  await server.close();
}
