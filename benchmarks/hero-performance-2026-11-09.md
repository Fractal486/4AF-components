# Homepage preview loading — 2026-11-09

The decorative component preview now loads after the window's load event, in a bounded idle
callback. Its responsive frame is present in the initial HTML. This removes the preview's
server-rendered component tree and defers its JavaScript without moving surrounding content.
Browsers without idle callbacks use a later task; navigating away cancels pending work.

## Measurement

Both builds use the same updated dependencies from L15: Next 16.4.5, React 19.3.1,
shadcn 4.23.0, and Wrangler 4.158.0. The baseline was built before changing HeroBackdrop.
Both were served by the local Workers static preview at `http://127.0.0.1:8787`, restarted
after each build. No builds or test suites ran during sampling.

`scripts/benchmark-site.mjs` schema 3, Chrome 157.0.8103.39, five fresh contexts per route,
1440×1000 viewport, light theme, normal motion, English locale, eight-second observation
window after page readiness. These are unthrottled local measurements, not field metrics.
The reports contain every sample: [before](hero-before-2026-11-09.json) and
[after](hero-after-2026-11-09.json).

Initial JavaScript means scripts referenced by the navigation HTML, measured using decoded
resource bytes, including preloaded scripts. Total JavaScript includes later script requests
within the observation window. Gzip HTML size is calculated locally, not measured over a CDN.

## Homepage results

Timing and layout-shift figures are medians of five runs. Sizes are bytes.

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| HTML | 788,258 | 224,316 | −71.5% |
| HTML, gzip | 65,262 | 16,048 | −75.4% |
| Initial script requests | 39 | 22 | −17 |
| Initial JavaScript | 1,625,988 | 960,441 | −40.9% |
| Total JavaScript after eight seconds | 1,916,813 | 1,923,096 | +0.3% |
| LCP | 220 ms | 140 ms | −80 ms |
| Non-input layout shift | 0.007636 | 0.000005 | Lower |
| Main-thread task time | 1,522 ms | 1,842 ms | +21.0% |
| Layout time | 70.6 ms | 66.8 ms | −5.3% |
| Script time | 348.9 ms | 346.0 ms | −0.8% |

The reliable gain is a smaller initial document and less upfront JavaScript. Total JavaScript
is effectively unchanged because the decoration still loads. This is not a reduction in total
CPU work: task time over the full observation window increased. LCP also varies substantially
in the baseline (196–1,292 ms versus 112–220 ms after), so the local timing result should not be
treated as a guaranteed field improvement.

The Button page remains a control: initial JavaScript is essentially unchanged
(1,415,739 → 1,415,853 bytes), layout shift is unchanged at 0.000005, and median task time is
719 → 697 ms. Its later idle preloads vary within the observation window; their smaller total
must not be attributed to the homepage optimization.

## Layout and behavior checks

Headless Chrome held idle callbacks until after the initial frame was measured, then released
them and waited for the artwork to render. The frame's position and dimensions were unchanged,
and the rendered artwork filled it exactly, in all five cases:

| Viewport and preference | Reserved artwork frame |
| --- | --- |
| 1440×1000, light | 1153×1000 |
| 390×844, light | 375×375 |
| 768×1024, light | 753×470.625 |
| 1440×1000, dark | 1153×1000 |
| 390×844, dark, reduced motion | 375×375 |

Widths account for the sidebar or scrollbar. Screenshots were inspected in desktop light and
phone dark/reduced-motion modes. No browser errors occurred. The preview is absent from the
server HTML; the heading and links remain available. “Browse components” still navigates
within the same document. The benchmark's layout-shift comparison passes on both routes.

Five unit tests cover load/idle ordering, an already-loaded document, cancellation before
load and during idle, and the timer fallback. Production build, typecheck, lint, registry
validation/build, and static export checks (including Workers HTTP headers and routing) pass.
