# 4AF Components

A personal component library. Components are pulled from public libraries, rebuilt to the
contract below, and inspected through a deliberately minimal site.

```
registry/     THE LIBRARY. Portable. Must never import from app/ or inspector/.
  lib/        cn, slot, motion presets — shared by components.
  ui/<name>/  <name>.tsx + <name>.variants.ts
inspector/    THE SITE. Imports registry. The reverse is a lint error, on purpose.
  entries/    One file per component: demo, settings schema, variant matrix, notes.
app/          Two routes and globals.css. That's the whole site.
_incoming/    Raw downloads, gitignored. Staging only — never imported.
```

`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm build`

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

## Motion: one variable controls all time

Every duration is `<base> * var(--motion-scale)`. The toolbar writes `data-motion` on
`<html>` and the whole app changes speed.

- `SLOW` (4x) is the review tool. At 1x a lazy ease and a considered one look identical.
  Judge every animation at 4x before calling it done.
- `REDUCED` (~0) is the a11y path. It's `0.01`, not `0` — a zero-length transition never
  fires `transitionend`, and any component that unmounts on that event would hang open
  forever.
- Looping indicators (spinners) must **not** be scaled. A 1s spin at 0.01 is a strobe —
  worse than the motion it was avoiding. Set their duration directly.

## Sources

All three are shadcn-compatible registries, so they all land in `_incoming/` automatically.

| Source | Built on | Expect to fix |
| --- | --- | --- |
| [Animate UI](https://animate-ui.com) | Multi-primitive; **take the Base UI variant** | Motion used for everything, including hovers and simple fades that should be CSS |
| [beUI](https://beui.dev) | Its own | Port behaviour to Base UI. Has machine-readable endpoints: `beui.dev/r/{slug}.json` and `/raw` |
| [basecn](https://basecn.dev) | Base UI ✅ | Closest to the contract already — mostly tokens and motion |

Plus one-off sources for specific jobs (loaders, charts). Same loop applies.

## Adding a component (the ingestion loop)

1. **Download.** `npx shadcn@latest add <url>` — `components.json` aliases point at
   `_incoming/`, so anything from any public registry lands in staging, never in the
   library. Note the source on the entry's `source` field.
2. **Rebuild to the contract.** Don't polish the download; rewrite it. Most public
   components fail on `transition: all`, hardcoded durations, hex colours, and missing
   `asChild`.
3. **Tokens only.** No hex, no `slate-*`/`zinc-*`. Semantic tokens (`bg-surface`,
   `text-muted-foreground`, `shadow-border`) or the ramps (`--color-accent-*`).
4. **Variants + settings**, then an entry in `inspector/entries/` and one line in
   `inspector/index.ts`.
5. **Review at 4x**, then in `REDUCED`, then by keyboard only, then in both themes.
6. `/review-animations` and `/code-review`.

## Design foundation (`app/globals.css`)

Warm-neutral greys (hue 70, chroma under 0.01) rather than the default cold slate; a single
amber accent. Three layers: **ramps** (raw scales, components never touch them) →
**semantic tokens** (what components consume) → **motion**.

Two colour decisions worth not re-litigating:

- **Primary is ink, not colour.** Colour is a signal; spend it on the one action that
  matters. That's what `brand` is for.
- **`accent-600` and `danger-600` sit at L 0.50–0.52** because that's the lightest a hue can
  be while still carrying white text at WCAG AA. In dark mode `brand` brightens (amber is a
  light hue — dark ink on it is correct), but `destructive` does *not*: dark-on-red reads as
  a warning label rather than a button, so it stays at L 0.52 with white text in both themes.

Radii are **concentric**: `outer = inner + padding`. An `rounded-xl` (14px) card with
`p-1` (4px) holds `rounded-lg` (10px) children. Reusing the same radius on both is the most
common reason an interface feels subtly wrong.

Buttons and cards get depth from **`shadow-border`**, not `border`. A shadow is built from
transparency, so it sits correctly on any background. Keep real borders for dividers and
table cells, where the job is separation, not elevation.
