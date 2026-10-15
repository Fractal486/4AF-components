# Improvement findings

Audit date: 2026-10-15. Reviewed commit: `5fc46c8`.
Status: **Command shortcuts, ClassicLoader, slider labels, Select Clear, table-of-contents refs,
demo loading, and SelectionToolbar notifications are resolved.** ClassicLoader was fixed before
this implementation pass. **Page zoom is excluded by request; its cap is restored. ASCII footer
remains open.**

Scope correction: the user's instruction referred to positions in the remaining-work list,
which omitted ClassicLoader. In that list, position 5 was page zoom, position 4 was the
table-of-contents ref fix, and position 7 was SelectionToolbar. The original nine audit IDs
below are retained for historical reference; they are not the remaining-work positions.

1. **Command shortcuts bypass action behavior.** Before the actions menu opens, a shortcut can run a confirmation-protected action immediately; async and toggle shortcuts do nothing. Make shortcuts follow the same behavior as clicking a row. Evidence: `registry/ui/command-palette/command-palette.actions.tsx:94`.

2. **ClassicLoader fails when rendered directly from a Server Component.** Its child helper lives in a client-only file. Move `useSlotChild` into a shared server/client module, preserve existing exports, and update registry metadata. An in-memory prototype confirmed ordinary server rendering without a client reference, plus working `asChild`, deferred children, refs, and click handlers. The optional `asChild` path retains the client-side Slot. Evidence: `registry/ui/classic-loader/classic-loader.tsx:76`, `registry/lib/slot.tsx:1`.

3. **Slider inputs lack accessible names.** Visible `label` text and the usual `aria-label` prop do not name the actual slider inputs. Connect labels to the inputs and distinguish range handles. Evidence: `registry/ui/slider/slider.tsx:620`, `:630`, `:753`.

4. **Select Clear ignores cancellation.** Clear changes the selection before calling the consumer and omits the required event details. A callback using `details.cancel()` throws after the value is cleared. Notify with valid details before committing an accepted change. Evidence: `registry/ui/select/select.tsx:378`.

5. **External refs break table-of-contents scrolling.** A supplied ref replaces the internal ref, disabling edge padding and active-entry centering in both variants. Merge the refs instead. Evidence: `registry/ui/table-of-contents/table-of-contents.tsx:204`, `registry/ui/table-of-contents-lines/table-of-contents-lines.tsx:69`.

6. **The site restricts page zoom.** `maximumScale: 1` prevents magnification in browsers that honor it. Remove the cap so users can enlarge documentation. Many modern browsers already ignore this restriction. Evidence: `app/layout.tsx:13`.

7. **Failed demo downloads leave an endless spinner.** Demo imports have no error state or recovery action; background failures also produce unhandled rejections. Handle failures and offer an appropriate retry or reload. Evidence: `stories/component-demo.tsx:230`, `:248`.

8. **SelectionToolbar misses visibility notifications.** Selecting text opens the toolbar without calling `onOpenChange`; selection collapse and action-driven closure also skip it. Notify once per effective visibility change. Evidence: `registry/ui/selection-toolbar/selection-toolbar.tsx:175`, `:214`, `:329`.

9. **The ASCII footer expands too early.** Hydration replaces 114 spans with 6,878 character spans, even offscreen or when reduced motion disables animation. Consider keeping compact text until animation is needed. The extra DOM work is confirmed; its effect on responsiveness needs measurement. Evidence: `components/landing/ascii-footer.tsx:126`, `:224`.

## Verification and scope

- Existing baseline: 466 tests across 61 files passed; typechecking passed; lint reported one warning in a copied skill asset.
- Findings 1–5 and 8 were reproduced in read-only, in-memory checks. Findings 6–7 were confirmed from source. Finding 9's DOM counts were calculated from source; no browser performance comparison was run.
- This was a hotspot-weighted audit, not an exhaustive browser/device or security assessment. No production build or fresh consumer installation was performed.
- Suggested starting set: findings 1–5. They are independent; add regression coverage before restructuring command action state. Measure finding 9 before optimizing it.

## Implementation verification — 2026-10-15

- Stateful command shortcuts now open the actions menu and use the row's confirmation, pending, or toggle behavior. Plain shortcuts still run immediately.
- Slider labels now name the actual inputs; range handles have distinct names and optional `thumbLabels` overrides.
- Select Clear supplies cancellable event details before committing. Failed demo downloads show a reload action, and background failures no longer reject unhandled.
- Added 18 regression cases. Full suite: **484/485 passed across 63 files**; the one failing, unchanged dialog animation visibility test passed on an isolated rerun (2/2). Earlier focused runs also exposed intermittent existing focus/timing assertions, which passed in the full run.
- Initial pass: typechecking, registry validation (56 items), registry build, production build, and export checks (55 docs, registry, search, skill ZIP) passed. The zoom change in that pass was a scope error and has been reversed.
- Lint: no errors; one existing unused-variable warning in a copied skill asset. Build: two generated Fumadocs `::highlight` CSS warnings. No deployment or fresh consumer installation performed.

## Scope correction

- Restored `maximumScale: 1` exactly; `app/layout.tsx` has no remaining diff.
- Both table-of-contents variants now merge caller refs with the internal navigation ref. Install metadata includes the shared refs utility.
- SelectionToolbar observes committed visibility and notifies once per change, including opening, selection collapse, action dismissal, Escape, and disabling. Callback replacement does not replay notifications.
- Added nine regression cases; all 34 focused tests across both table-of-contents variants and SelectionToolbar passed. Registry validation and registry build passed.
- Correction checks: all 12 registry tests passed; typecheck, production build, and export checks passed. Lint still has only the existing warning. Built HTML confirms `maximum-scale=1` is restored.
