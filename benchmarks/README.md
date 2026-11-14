# Site benchmark

`pnpm benchmark:site` measures the current homepage and Button documentation page using an
installed Chrome/Chromium through `playwright-core`. It does not download a browser.

Stop `pnpm dev` before building. Run `pnpm build`, then start the static export with `pnpm start`.
Restart the preview after every rebuild so Wrangler uses the current asset manifest. In a
separate terminal:

```sh
PERF_RUNS=5 node scripts/benchmark-site.mjs > before.json
# Make a change, rebuild, and restart the preview.
PERF_RUNS=5 PERF_COMPARE=before.json node scripts/benchmark-site.mjs > after.json
```

`PERF_URL` defaults to `http://127.0.0.1:8787`, `PERF_RUNS` defaults to 3 and must be a positive
integer. By default Playwright’s `chrome` channel locates installed Google Chrome on Windows,
macOS, or Linux. Set `CHROME_PATH` to an explicit Chrome/Chromium executable to override it.
A launch failure explains how to install Chrome or supply that path. The server must serve
the production site matching this checkout’s component catalog.

In PowerShell, set environment variables separately:

```powershell
$env:PERF_RUNS = "5"
node scripts/benchmark-site.mjs > before.json
# After changing, rebuilding, and restarting the preview:
$env:PERF_COMPARE = "before.json"
node scripts/benchmark-site.mjs > after.json
```

Each sample uses a fresh browser context at 1440×1000, light theme, English locale, and no
reduced-motion preference. The script waits for the homepage heading or the visible Button
settings panel, then observes another eight seconds. It records LCP, non-input layout shifts,
heading geometry reads, requested scripts and decoded script bytes, and Chrome main-thread,
layout, and script time. Medians and raw samples are written to stdout as JSON. HTML size comes
from the actual navigation response; gzip size is computed locally, not measured CDN transfer.

Browser page errors fail the run. The script also rejects
non-200 page responses and HTML that changes between samples of the same page.

Version 3 also separates scripts referenced by the initial HTML from scripts requested later.
The initial group includes scripts fetched through preload links; totals also include scripts
requested later. Both use decoded response bytes.
This distinguishes deferred JavaScript from a reduction in total JavaScript.

Version 3 comparison reports require the same browser version, viewport, observation window,
theme, motion preference, locale, and run count. Comparison fails if median layout shift grows
by more than 0.001. Other metrics are reported for inspection; they have no automatic regression
threshold. The historical file-browser reports use an incompatible format and are rejected
with a request to record a new baseline.

Keep builds and tests out of the sampling window. These are local lab measurements, not field
Core Web Vitals. Use repeated runs and inspect variability before drawing performance conclusions.
The [2026-10-12 report](site-performance.md) and its samples remain as historical evidence.
The [2026-11-09 hero report](hero-performance-2026-11-09.md) measures the current homepage's
deferred preview, including initial payload savings and the total-work tradeoff.
