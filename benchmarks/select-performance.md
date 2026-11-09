# Select render profile — 2026-11-09

Finding 16 was confirmed with 500 mounted options in headless Chrome 157.0.8103.39.
The harness uses React's programmatic Profiler and counts each Base UI row's class-name
render callback. This collects React timing without opening the interactive DevTools UI.

| Interaction | Row render calls before → after | Distinct rows before → after | Median React render time before → after |
| --- | --- | --- | --- |
| Hover from Option 001 to Option 002 | 502 → 4 | 500 → 2 | 28.7 → 3.6 ms |
| Search `Option` (all rows still match) | 500 → 0 | 500 → 0 | 23.5 → 3.7 ms |
| Search `Option 499` (one remaining row) | 1000 → 501 | 500 → 500 | 84.1 → 34.8 ms |

The stable selection/registration context is memoized. Highlight and filtering have separate
contexts. A small per-item reader passes derived booleans to a memoized row, so only changed
rows repeat their Base UI/content work. Filtering still visits all items, and hiding 499 of
them still updates those rows. Flat lists also skip descendant searches when no nested options
are registered. Search Select's own context is memoized independently of its input query.

These are three fresh-page samples per revision, with reduced motion, the React development
build, stable caller props, and an unstyled isolated fixture. The sum of Profiler
`actualDuration` values measures React render work; it is not end-to-end input latency or a
production performance guarantee. The cheap context readers still run for each item.
The deterministic render counts are the regression signal; wall-clock times are descriptive.

Raw samples: [before](select-before.json), [after](select-after.json).

Reproduce from the repository root:

```text
node scripts/profile-select.mjs benchmarks/select-profile-latest.json
```

The script starts an isolated Vite server using Vitest's installed Vite dependency, launches
installed Chrome headlessly, checks filtering and browser errors, then closes both. It does
not use Next's `.next` directory or require a running site. The fixture lives in
`benchmarks/select-profile/`. Keep the same browser and conditions for comparisons.
