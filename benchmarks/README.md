# Site benchmark

`pnpm benchmark:site` measures the current homepage and Button documentation page using an
installed Chrome/Chromium through `playwright-core`. It does not download a browser.

Stop `pnpm dev` before building. Run `pnpm build`, then start the static export with `pnpm start`.
Restart the preview after every rebuild so Wrangler uses the current asset manifest. In a
separate terminal:

```sh
CHROME_PATH=/usr/bin/google-chrome PERF_RUNS=5 node scripts/benchmark-site.mjs > before.json
# Make a change, rebuild, and restart the preview.
CHROME_PATH=/usr/bin/google-chrome PERF_RUNS=5 PERF_COMPARE=before.json node scripts/benchmark-site.mjs > after.json
```

`PERF_URL` defaults to `http://127.0.0.1:8787`, `PERF_RUNS` defaults to 3 and must be a positive
integer, and `CHROME_PATH` defaults to `/usr/bin/google-chrome`. The server must serve the
production site matching this checkout's component catalog.

Each sample uses a fresh browser context at 1440×1000, light theme, English locale, and no
reduced-motion preference. The script waits for the homepage install command or the Button
settings panel, then observes another eight seconds. It records LCP, non-input layout shifts,
heading geometry reads, requested scripts and decoded script bytes, and Chrome main-thread,
layout, and script time. Medians and raw samples are written to stdout as JSON. HTML size comes
from the actual navigation response; gzip size is computed locally, not measured CDN transfer.

After measuring the homepage, it checks that the displayed install command belongs to the
registry, stays still while hovered, and resumes cycling when the pointer leaves. These checks
are outside the measurement window. Browser page errors fail the run. The script also rejects
non-200 page responses and HTML that changes between samples of the same page.

Version 2 comparison reports require the same browser version, viewport, observation window,
theme, motion preference, locale, and run count. Comparison fails if median layout shift grows
by more than 0.001. Other metrics are reported for inspection; they have no automatic regression
threshold. The historical file-browser reports use an incompatible format and are rejected
with a request to record a new baseline.

Keep builds and tests out of the sampling window. These are local lab measurements, not field
Core Web Vitals. Use repeated runs and inspect variability before drawing performance conclusions.
The [2026-10-12 report](site-performance.md) and its samples remain as historical evidence.
