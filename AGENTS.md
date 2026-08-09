# 4AF Components

A personal component library. Components are pulled from public libraries, rebuilt to the
contract below, and inspected through a deliberately minimal site.

```
registry/     THE LIBRARY. Portable. Must never import from app/, content/, stories/, or inspector/.
  lib/        cn, slot, motion presets — shared by components.
  ui/<name>/  <name>.tsx + <name>.variants.ts
stories/      Shared Fumadocs demo adapter.
content/docs/ FUMADOCS MDX. One routed page per installable component.
app/          Next.js shell, Fumadocs routes, and self-hosted search.
inspector/    Data-driven demo entries, controls, and schemas. Never routed directly.
_incoming/    Raw downloads, gitignored. Staging only — never imported.
```

`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm build`

## Using the library from another project

Agents should use the CLI instead of manually copying files or guessing registry URLs.
From this repository:

```text
pnpm 4af list
pnpm 4af doctor --project <absolute-target-project>
pnpm 4af install <component> --project <absolute-target-project>
```

`install` builds and serves the private registry automatically, invokes shadcn
non-interactively, and brings in the 4AF theme plus shared utilities. Add `--overwrite`
only when replacing files is intentional. Use `--dry-run` to inspect the complete mutation
plan without writing to the target project.

The installable component names include `button`, `input`, `toggle`, `morph`, `action-button`,
`copy-button`, `tabs`, `sidebar`, and `sidebar-layout`. The target project must already have a `package.json` and
shadcn `components.json` with `ui` and `lib` aliases. Run `pnpm 4af doctor` first when
an agent is unsure whether the target is ready.

`AGENTS.md` is the always-on contract: it explains architecture and non-negotiable
rules. The CLI is the deterministic tool that performs the workflow. When the
`$4af-components` skill is available, invoke it for richer guidance; it must call the CLI
rather than reimplementing installation logic.

> **Never run `pnpm build` while `pnpm dev` is running.** They share `.next/`, and the
> build empties the CSS chunks the dev server is serving — the page keeps working but
> arrives with no styles, which looks exactly like a broken stylesheet. Stop dev first, or
> `rm -rf .next` and restart it afterwards.

## The component contract

Every component in `registry/ui/` must satisfy all of this. It's the reason the library is
worth reusing; a component that skips a line here is a component we'll rewrite later.

- **Behaviour comes from a primitive, and the primitive is Base UI.** Never hand-roll a
  focus trap, roving tabindex, or dismiss logic. Base UI is the *canonical* layer: a
  component that arrives on Radix or Headless UI gets ported during refinement, not kept.
  Shipping two behaviour layers means two focus traps, two portal strategies, and two
  subtly different `data-state` vocabularies — invisible at three components, miserable at
  twenty. (`registry/lib/slot.tsx` is ours only because `asChild` is too small to import a
  primitive for.)
- **Composable.** `ref` forwarded, props spread, `asChild` wherever an element swap is
  plausible (use `registry/lib/slot.tsx`).
- **Variants in a sibling `.variants.ts`** via CVA. That file is the "versions" axis.
- **State on the element.** `data-variant`, `data-loading`, `data-state`. Styling and tests
  hook off attributes, not off conditional `className` strings.
- **Controlled and uncontrolled** both work (`value` / `defaultValue` / `onValueChange`).
- **Motion is compositor-only.** Animate `transform`/`scale`, `opacity`, `filter`,
  `clip-path`. Never `width`, `height`, `top`, `left` — those relayout every frame.
- **Name the properties you transition.** `transition-[scale,opacity]`, never bare
  `transition` or `transition: all` (which is `transition-property: all` — the browser then
  watches every property, and variant switches animate their own padding).
- **Durations come from tokens**: `duration-(--duration-fast|base|slow|slower)`. Never a
  hardcoded `duration-150`, or the component won't respond to the motion controls.
- **`will-change` only when a measured stutter justifies it.** Each one costs a
  compositing layer.
- **`"use client"` only when interactive.**

## Motion

CSS-first. Reach for Motion only when CSS genuinely can't do the job:

- **An element must animate while leaving.** React unmounts it immediately; only
  `AnimatePresence` can hold it on screen long enough to exit. (This is what `IconMorph`
  is for, and it's the most common honest reason.)
- **Drag / swipe**, and anything that follows a finger and then settles.
- **Spring physics** — a spring absorbs a new target mid-flight, a tween restarts.
- **Layout animation** (FLIP): a tab indicator sliding between tabs.

Hover, press, focus and simple fades are CSS. They don't need a runtime.

**Reduced motion is handled twice, because the cascade doesn't reach JS.**

- CSS components: durations come from `--duration-*`, which a media query collapses to
  `1ms`. Never hardcode `duration-150` — that opts the component out of the rule.
  It's `1ms` and not `0` because a zero-length transition never fires `transitionend`,
  and any component that unmounts on that event would hang open forever.
- Motion components: `useReducedMotion()` → `{ duration: 0 }`. Not a very short spring —
  a spring with a near-zero duration doesn't settle, it snaps.
- Looping progress indicators (spinners) are exempt from both. A 1s spin collapsed to ~0 is a
  strobe, which is worse than the motion it was avoiding. Set their duration directly.

## Sources

All three are shadcn-compatible registries, so they all land in `_incoming/` automatically.

| Source | Built on | Expect to fix |
| --- | --- | --- |
| [Animate UI](https://animate-ui.com) | Multi-primitive; **take the Base UI variant** | Motion used for everything, including hovers and simple fades that should be CSS |
| [beUI](https://beui.dev) | Its own | Port behaviour to Base UI. Has machine-readable endpoints: `beui.dev/r/{slug}.json` and `/raw` |
| [basecn](https://basecn.dev) | Base UI ✅ | Closest to the contract already — mostly tokens and motion |

Plus one-off sources for specific jobs (loaders, charts). Same loop applies.

## Adding a component (the ingestion loop)

1. **Download.** `pnpm exec shadcn add <url>` — the locally pinned CLI and
   `components.json` aliases point at
   `_incoming/`, so anything from any public registry lands in staging, never in the
   library.
2. **Rebuild to the contract.** Don't polish the download; rewrite it. Most public
   components fail on `transition: all`, hardcoded durations, hex colours, and missing
   `asChild`.
3. **Tokens only.** No hex, no `slate-*`/`zinc-*`. Semantic tokens (`bg-surface`,
   `text-muted-foreground`, `shadow-border`) or the ramps (`--color-accent-*`).
4. **Variants + demo controls**, then an entry in `inspector/entries/` and an MDX page.
5. **Review at 4x**, then in reduced motion, then by keyboard only, then in both themes.
6. `/review-animations` and `/code-review`.

## Design foundation (`app/globals.css`)

Warm-neutral greys (hue 70, chroma under 0.01) rather than the default cold slate; a single
amber accent. Three layers: **ramps** (raw scales, components never touch them) →
**semantic tokens** (what components consume) → **motion**.

Two colour decisions worth not re-litigating:

- **Primary is ink, not colour.** Colour is a signal; the neutral action is the default,
  while amber is reserved for the ring and other focused signals.
- **`accent-600` and `danger-600` sit at L 0.50–0.52** because that's the lightest a hue can
  be while still carrying white text at WCAG AA. `destructive` stays at L 0.52 with white
  text in both themes: dark-on-red reads as a warning label rather than a button.

Radii are **concentric**: `outer = inner + padding`. An `rounded-xl` (14px) card with
`p-1` (4px) holds `rounded-lg` (10px) children. Reusing the same radius on both is the most
common reason an interface feels subtly wrong.

**Optical alignment belongs in the SVG, not in margins.** Icon-only buttons centre
*geometrically*, and that's correct — Lucide already balances its glyphs inside the 24×24
box (the play triangle, whose mass sits left of its bounding box, ships pre-shifted 1 unit
right). Measure the ink with `getBBox()` before "fixing" anything; a blanket optical offset
would push the correctly-centred glyphs off. What *does* need correcting is an icon sitting
**beside** something: a leading or trailing icon in a text button shaves 2px off its side,
driven by `data-icon-start` / `data-icon-end`.

Buttons and cards get depth from **`shadow-border`**, not `border`. A shadow is built from
transparency, so it sits correctly on any background. Keep real borders for dividers and
table cells, where the job is separation, not elevation.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
