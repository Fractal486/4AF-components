# Site performance — 2026-10-12

Two focused changes retained after measuring the production static export:

- Serialize the homepage's build-time highlighted source as escaped HTML instead of thousands of React token elements. The file browser still receives all nine files immediately; switching files needs no fetch. `hast-util-to-html` was already in the dependency graph and is now a direct build-time dependency. It adds no browser library.
- Reserve the demo's actual 42rem height in its loading placeholder. Loading an entry no longer pushes the article below it down by 384px.

## Before and after

| Measurement | Before | After | Change |
| --- | ---: | ---: | ---: |
| Homepage HTML, bytes | 651,561 | 533,880 | −18.1% |
| Homepage HTML, gzip bytes | 55,981 | 45,463 | −18.8% |
| Button initial-load layout shift | 0.0399099 | 0.0000051 | −99.99% |
| Homepage initial-load layout shift | 0.0000051 | 0.0000051 | Unchanged |
| Homepage requested script resources | 35 | 35 | Unchanged |
| Button requested script resources | 86 | 86 | Unchanged |
| Homepage LCP, ms | 116 | 108 | Timing only |
| Button LCP, ms | 80 | 88 | Timing only |
| Homepage main-thread task time, ms | 1,307.4 | 1,244.2 | Timing only |
| Button main-thread task time, ms | 1,114.8 | 1,109.7 | Timing only |

Runtime values are medians of five fresh browser contexts per page. The eight-second observation window includes existing demo preloading and ongoing animations. Layout shift is the sum of non-input shift entries in that window. Gzip is computed locally with Node's default gzip settings, not measured CDN transfer. Requested JavaScript grew by one byte on each page; the serializer stays on the server/build side.

Timing differences are small and mixed, with overlapping LCP ranges (homepage: 104–152ms before / 104–156ms after; Button: 80–92ms / 76–108ms). These samples do **not** establish a CPU or LCP speedup or a consistent slowdown. The accepted wins are deterministic payload reduction and the repeatable elimination of the demo's layout shift.

## Method and reproduction

Baseline: working tree at `3fea972`, including the user's pre-existing uncommitted edits. Those edits were preserved. Separate sheet/sidebar edits and another export appeared after the measured builds; they were left untouched and are outside this before/after comparison. Both measurements used production `pnpm build` output, Wrangler's local static-assets preview, Chrome 155.0.8059.39, Node 26.10.0, a 1440×1000 viewport, no artificial throttling, and no build/test jobs launched by this task during sampling (other desktop activity was not controlled). This is a local lab comparison, not field Core Web Vitals.

Stop `pnpm dev` before building. After each build, restart `pnpm start` so Wrangler uses the new asset manifest. In another terminal:

```sh
CHROME_PATH=/usr/bin/google-chrome PERF_RUNS=5 node scripts/benchmark-site.mjs > before.json
# Make a change, rebuild, and restart the preview.
CHROME_PATH=/usr/bin/google-chrome PERF_RUNS=5 PERF_COMPARE=before.json node scripts/benchmark-site.mjs > after.json
```

`pnpm benchmark:site` runs the same script. `PERF_URL` overrides the default `http://127.0.0.1:8787`; `CHROME_PATH` selects an installed Chrome/Chromium binary. The benchmark uses `playwright-core` without downloading a browser. Compare the same browser, export, viewport, and number of runs. Keep build/test jobs out of the measurement window.

The benchmark checks every file-browser selection, hashes source text plus token styles/classes/tabindex, fails on browser page errors, and optionally checks those fingerprints and layout-shift non-regression against a previous run. Raw samples: [before](site-before.json), [after](site-after.json).

## Verification and scope

- All nine installed-file source fingerprints match before and after in every run.
- Source-pane screenshots are pixel-identical at 1440px and 390px in light and dark themes (reduced motion, fonts loaded). Both versions emit the same pre-existing failed Next prefetch for `/llms.txt/__next._tree.txt`; it is unrelated to these changes.
- Highlighting regression test covers source fidelity, light/dark token colors, keyboard focus, and HTML escaping of source containing an injection-shaped string.
- Measured change: 457 tests pass across 60 files (baseline: 456 across 59). A final check including the later concurrent edits passes 458 tests, lint, and typecheck.
- Lint, typecheck, production build, and static-export checks pass, including HTTP routing/headers, 55 Markdown documents, 56 registry items, search, and the skill ZIP.

The scan also examined shared navigation, table-of-contents measurement, client imports, and demo preloading. Button's existing idle preload reaches 86 script resources / about 2.01MB decoded JavaScript. Removing it would trade transfer savings for slower first visits to other demos, so this pass retains the existing navigation behavior. No portable component API or source was changed by this work.
