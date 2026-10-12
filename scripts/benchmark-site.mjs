import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { chromium } from "playwright-core";

// Build first, then run against `pnpm start`. Use the same browser/viewport for comparisons.
// CHROME_PATH selects an installed Chrome/Chromium; no browser download is required.
const baseURL = process.env.PERF_URL ?? "http://127.0.0.1:8787";
const runs = Number(process.env.PERF_RUNS ?? 3);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome",
  headless: true,
});
const report = { browser: browser.version(), viewport: "1440x1000", runs, pages: {} };
try {
  for (const [route, file] of [["/", "index.html"], ["/docs/button", "docs/button.html"]]) {
    const html = await readFile(new URL(`../out/${file}`, import.meta.url));
    const samples = [];
    let files = [];
    for (let run = 0; run < runs; run++) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        window.__perf = { headingReads: 0, lcp: 0, cls: 0 };
        const rect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = function (...args) {
          if (this.matches("h1,h2,h3,h4,h5,h6,section[id]")) window.__perf.headingReads++;
          return rect.apply(this, args);
        };
        new PerformanceObserver((list) => {
          window.__perf.lcp = list.getEntries().at(-1).startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__perf.cls += entry.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      const cdp = await context.newCDPSession(page);
      await cdp.send("Performance.enable");
      await page.goto(new URL(route, baseURL).href);
      await page.locator(route === "/" ? "#installed-file pre" : 'section[aria-label="Button settings"]').waitFor();
      // Fixed observation window includes the existing idle demo preload queue.
      await page.waitForTimeout(8000);
      const metrics = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(({ name, value }) => [name, value]));
      const observed = await page.evaluate(() => ({
        ...window.__perf,
        scripts: performance.getEntriesByType("resource").filter((r) => r.initiatorType === "script").length,
        scriptBytes: performance.getEntriesByType("resource").filter((r) => r.initiatorType === "script").reduce((sum, r) => sum + r.decodedBodySize, 0),
      }));
      samples.push({ ...observed, taskMs: metrics.TaskDuration * 1000, layoutMs: metrics.LayoutDuration * 1000, scriptMs: metrics.ScriptDuration * 1000 });
      // Exercise every installed source tab. Checks survive changes to its representation.
      if (route === "/") {
        const fingerprints = [];
        for (const button of await page.getByRole("navigation", { name: "Installed files" }).getByRole("button").all()) {
          await button.click();
          assert.equal(await button.getAttribute("aria-pressed"), "true");
          const source = await page.locator("#installed-file pre").evaluate((pre) => ({
            text: pre.textContent,
            tokens: Array.from(pre.querySelectorAll("span"), (span) => [span.textContent, span.style.cssText]),
            style: pre.style.cssText,
            classes: [...pre.classList].sort(),
            tabIndex: pre.tabIndex,
          }));
          assert.ok(source.text.length > 0);
          fingerprints.push({
            name: await page.locator("#installed-file").getAttribute("aria-label"),
            sha256: createHash("sha256").update(JSON.stringify(source)).digest("hex"),
          });
        }
        if (run > 0) assert.deepEqual(fingerprints, files);
        files = fingerprints;
      }
      assert.deepEqual(errors, [], `${route}: browser errors`);
      await context.close();
    }
    const median = Object.fromEntries(Object.keys(samples[0]).map((key) => [key, samples.map((s) => s[key]).sort((a, b) => a - b)[Math.floor(runs / 2)]]));
    report.pages[route] = { htmlBytes: html.length, htmlGzipBytes: gzipSync(html).length, median, samples, files };
  }
  if (process.env.PERF_COMPARE) {
    const before = JSON.parse(await readFile(process.env.PERF_COMPARE, "utf8"));
    for (const route of Object.keys(report.pages)) {
      assert.deepEqual(report.pages[route].files, before.pages[route].files, `${route}: highlighted source changed`);
      assert.ok(report.pages[route].median.cls <= before.pages[route].median.cls + 0.001, `${route}: layout shift regressed`);
    }
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
