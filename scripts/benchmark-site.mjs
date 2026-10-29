import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { chromium } from "playwright-core";

// Build first, then run against `pnpm start`. Use the same browser/viewport for comparisons.
// CHROME_PATH selects an installed Chrome/Chromium; no browser download is required.
const baseURL = process.env.PERF_URL ?? "http://127.0.0.1:8787";
const runs = Number(process.env.PERF_RUNS ?? 3);
assert.ok(Number.isSafeInteger(runs) && runs > 0, "PERF_RUNS must be a positive integer.");
const measurement = {
  schemaVersion: 2,
  viewport: "1440x1000",
  observationMs: 8000,
  colorScheme: "light",
  reducedMotion: "no-preference",
  locale: "en-US",
};
const before = process.env.PERF_COMPARE
  ? JSON.parse(await readFile(process.env.PERF_COMPARE, "utf8"))
  : undefined;
if (before) {
  assert.equal(before.schemaVersion, measurement.schemaVersion,
    "Incompatible benchmark report. Record a new baseline with the current script; legacy file-browser reports cannot be compared.");
  for (const [key, value] of Object.entries({ ...measurement, runs })) {
    assert.equal(before[key], value, `Baseline ${key} differs; use the same measurement settings.`);
  }
}
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome",
  headless: true,
});
const report = { ...measurement, browser: browser.version(), runs, pages: {} };
try {
  if (before) assert.equal(before.browser, report.browser, "Baseline browser differs; use the same browser version.");
  for (const route of ["/", "/docs/button"]) {
    let html;
    const samples = [];
    for (let run = 0; run < runs; run++) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        colorScheme: measurement.colorScheme,
        reducedMotion: measurement.reducedMotion,
        locale: measurement.locale,
      });
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
      const response = await page.goto(new URL(route, baseURL).href);
      assert.equal(response?.status(), 200, `${route}: expected a successful page response`);
      const servedHtml = await response.body();
      if (html) assert.deepEqual(servedHtml, html, `${route}: served HTML changed during sampling`);
      html = servedHtml;
      await page.locator(route === "/" ? "[data-hero] h1" : 'section[aria-label="Button settings"]').waitFor();
      // Fixed observation window includes the existing idle demo preload queue.
      await page.waitForTimeout(measurement.observationMs);
      const metrics = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(({ name, value }) => [name, value]));
      const observed = await page.evaluate(() => ({
        ...window.__perf,
        scripts: performance.getEntriesByType("resource").filter((r) => r.initiatorType === "script").length,
        scriptBytes: performance.getEntriesByType("resource").filter((r) => r.initiatorType === "script").reduce((sum, r) => sum + r.decodedBodySize, 0),
      }));
      samples.push({ ...observed, taskMs: metrics.TaskDuration * 1000, layoutMs: metrics.LayoutDuration * 1000, scriptMs: metrics.ScriptDuration * 1000 });
      assert.deepEqual(errors, [], `${route}: browser errors`);
      await context.close();
    }
    const median = Object.fromEntries(Object.keys(samples[0]).map((key) => [key, samples.map((s) => s[key]).sort((a, b) => a - b)[Math.floor(runs / 2)]]));
    report.pages[route] = { htmlBytes: html.length, htmlGzipBytes: gzipSync(html).length, median, samples };
  }
  if (before) {
    for (const route of Object.keys(report.pages)) {
      assert.ok(Number.isFinite(before.pages?.[route]?.median?.cls), `${route}: baseline layout shift is missing or invalid`);
      assert.ok(report.pages[route].median.cls <= before.pages[route].median.cls + 0.001, `${route}: layout shift regressed`);
    }
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
