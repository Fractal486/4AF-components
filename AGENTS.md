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

`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build`

Run `pnpm registry:validate` and `pnpm registry:build` after changing install metadata or
portable component source.

## Using the library from another project

The library is a public shadcn registry at `https://4af.selfsimilar.dev` (`lib/site.ts` holds the
address). Install with the shadcn CLI, run in the target project:

```text
npx shadcn@latest add https://4af.selfsimilar.dev/r/<component>.json
npx shadcn@latest add https://4af.selfsimilar.dev/r/<component>.json --dry-run
npx shadcn@latest info
npx shadcn@latest search https://4af.selfsimilar.dev/r/registry.json -t ui
```

The target needs a shadcn `components.json` (`npx shadcn@latest init`). Dependencies, the 4AF
theme, and shared utilities install with the component. Unchanged source files are skipped;
differing files prompt before replacement unless `--overwrite` is passed. Package and
stylesheet updates still apply when source files are skipped. Preview an update with
`add <url> --overwrite --diff`. Consumers need React 19 and Tailwind CSS v4. Component installs
preserve existing theme variable values, and fonts remain the caller's responsibility.
To use `@4af/<component>` and `npx shadcn@latest search @4af`, register
the namespace once: `npx shadcn@latest registry add @4af=https://4af.selfsimilar.dev/r/{name}.json`.

Each page is available as Markdown at `https://4af.selfsimilar.dev/docs/<component>.md`, and
`/llms.txt` lists them all. `registry.json` is the authoritative list of installable names.

`registry.json` names dependencies by their public address, so an install always resolves them
from the deployed site. `pnpm build` runs `shadcn build` first, so a deploy serves current
`/r/*.json` files. To try an unreleased change in another project, run `pnpm registry:build` and
`pnpm dev`, then add from `http://localhost:3000/r/<component>.json`; its dependencies still come
from the deployed site.

## Static site deployment

Production uses a Next.js static export for Cloudflare Workers Static Assets. `pnpm build` generates the
registry, prerenders the site, then publishes the exported Markdown at `/docs.md` and
`/docs/<slug>.md` via `scripts/finalize-export.mjs`. Development keeps those URLs through
Next rewrites. Search uses Fumadocs' browser-side static client and `/api/search` index;
the skill download is also generated at build time. Keep route handlers static and avoid
request-time server features.

`pnpm start` previews `out/` through Wrangler Workers on port 8787. `pnpm test:export` verifies
the exported files, search results, and ZIP contents; pass `http://127.0.0.1:8787` to check
the running preview's headers and routing too. Static response headers and redirects belong
in `public/_headers` and `public/_redirects`, not in Next's production config.

`AGENTS.md` is the always-on contract: it explains architecture and non-negotiable rules. When
the `$4af-components` skill is available, invoke it for richer guidance; it uses the shadcn CLI
rather than reimplementing installation logic.

> **Never run `pnpm build` while `pnpm dev` is running.** They share `.next/`, and the
> build empties the CSS chunks the dev server is serving — the page keeps working but
> arrives with no styles, which looks exactly like a broken stylesheet. Stop dev first, or
> `rm -rf .next` and restart it afterwards.

## Fumadocs documentation

`content/docs/` is the public Fumadocs surface. Every installable `registry:ui` item has a
`content/docs/<name>.mdx` page with frontmatter, an interactive `<ComponentDemo>`, an
install/usage `<ComponentReference>`, an `## API` summary, and component-specific notes.
The site serves that page as plain Markdown at `/docs/<component>.md` for agents, with the
install and usage blocks expanded.

When adding a component, update all of the relevant sources together:

1. `registry/ui/<name>/` — portable implementation, variants, and tests.
2. `registry.json` — install name, description, files, dependencies, and registry dependencies.
3. `inspector/entries/` — the demo and settings controls, when the component needs a demo.
4. `content/docs/<name>.mdx` — title/description, demo, install/usage reference, API, and notes;
   add the page to `content/docs/meta.json` so Fumadocs includes it.
5. `lib/component-catalog.ts` — the sidebar family, catalog category, and main API mapping when
   the new item changes those derived views.
6. `lib/component-reference.ts` — the canonical usage snippet used by the page and its Markdown.

Larger components are split into sibling modules behind their public entry point; the file map
is under "Component modules" in `.agents/skills/4af-components/references/component-catalog.md`.
Check a registry item's complete `files` list when changing one.

Loading states use `LoadingIndicator` from `registry/lib/loader`. The public `loader` slot takes
a React node; `LoaderProvider loader={<MySpinner />}` sets a default for a subtree, portals
included. A local slot overrides it, and a custom pending icon overrides both. `ClassicLoader` is
the fallback and installs through the shared loader utility. Don't add built-in loader variants;
alternative indicators such as ASCII or Matrix and their settings belong to the caller.

When editing a public API or behavior, update its component page's API/notes and the shared
usage reference as well as the source, tests, registry metadata, and demo that changed. The
component catalog page and count are generated from `registry.json`; do not hand-edit their
rows or count. Update `COMPONENTS.md` and the agent reference catalog when public composition
guidance or the installable catalog changes. For topic-level changes, update the matching page
under `content/docs/reference/`.

## The component contract

Every component in `registry/ui/` must satisfy all of this. It's the reason the library is
worth reusing; a component that skips a line here is a component we'll rewrite later.

- **Use Base UI for interaction primitives.** Calendar uses react-day-picker because Base UI
  has no calendar primitive. Never hand-roll a
  focus trap, roving tabindex, or dismiss logic. Base UI is the *canonical* layer: a
  component that arrives on Radix or Headless UI gets ported during refinement, not kept.
  Shipping two behaviour layers means two focus traps, two portal strategies, and two
  subtly different `data-state` vocabularies — invisible at three components, miserable at
  twenty. (`registry/lib/slot.tsx` is ours only because `asChild` is too small to import a
  primitive for.)
- **Composable.** `ref` forwarded, props spread, `asChild` wherever an element swap is
  plausible (use `registry/lib/slot.tsx`).
- **Variants in a sibling `.variants.ts`** via CVA. That file holds the variant definitions.
- **State on the element.** `data-variant`, `data-loading`, `data-state`. Styling and tests
  hook off attributes, not off conditional `className` strings.
- **Controlled and uncontrolled state** both work where relevant, using the component's
  value, checked, pressed, or open API.
- **List panels open with an active row.** Activate the current selection, the most recent
  selected value for multi-select, or the first enabled row when nothing is selected.
  A query activates the first match. Keep the active row when the pointer leaves.
  Use `data-panel-active`, or Base UI's `data-highlighted` when it owns the highlight.
  `autoFocusFirstItem={false}` opts out for menu-like uses. See the
  [Select Search implementation notes](content/docs/select-search.mdx#highlight-implementation)
  for Base UI's `autoHighlight` / `keepHighlight` requirements.
  Ordinary Dropdown Menu submenus are an exception: pointer-hover openings start without a
  highlighted row, while keyboard openings activate the first enabled row.
- **Prefer compositor-friendly motion.** Animate `transform`/`scale`, `opacity`, `filter`,
  and `clip-path`. Collapsible's height transition, Sidebar's shell dimensions and
  offcanvas position, and Morph's opt-in `sizing="current"` width are accepted layout-motion
  exceptions. Other components must avoid
  animating layout properties such as `width`, `height`, `top`, and `left`.
- **Name the properties you transition.** `transition-[scale,opacity]`, never bare
  `transition` or `transition: all` (which is `transition-property: all` — the browser then
  watches every property, and variant switches animate their own padding).
- **CSS durations come from tokens**: `duration-(--duration-fast|base|slow|slower)`. Never a
  hardcoded `duration-150`, or the component won't respond to the motion controls.
  JavaScript duration and easing defaults mirror the CSS tokens and must be updated together;
  JavaScript animations handle reduced motion separately.
- **`will-change` only when a measured stutter justifies it.** Each one costs a
  compositing layer.
- **Add `"use client"` when client APIs, hooks, context, or interaction require it.**

## Motion

CSS-first. Reach for Motion only when CSS genuinely can't do the job:

- **A React-controlled swap needs outgoing content retained for exit.** `Morph` uses
  `AnimatePresence` for this. Base UI popups can use CSS exits through their presence lifecycle.
- **Drag / swipe**, and anything that follows a finger and then settles.
- **Spring physics** — a spring absorbs a new target mid-flight, a tween restarts.
- **Layout animation** (FLIP): a tab indicator sliding between tabs.

Hover, focus, simple fades, and ordinary press feedback use CSS. Button and Toggle use Motion
for spring press feedback; their CSS composition paths use the duration tokens.

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

All three are shadcn-compatible registries. The local `ui`, `lib`, and `hooks` aliases stage
their source in `_incoming/`; the `utils` alias points at the library's existing `cn` helper.
Review the CLI diff for utilities, dependencies, and stylesheet changes before ingestion.

| Source | Built on | Expect to fix |
| --- | --- | --- |
| [Animate UI](https://animate-ui.com) | Multi-primitive; **take the Base UI variant** | Motion used for everything, including hovers and simple fades that should be CSS |
| [beUI](https://beui.dev) | Its own | Port behaviour to Base UI. Has machine-readable endpoints: `beui.dev/r/{slug}.json` and `/raw` |
| [basecn](https://basecn.dev) | Base UI ✅ | Closest to the contract already — mostly tokens and motion |

Plus one-off sources for specific jobs (loaders, charts). Same loop applies.

## Adding a component (the ingestion loop)

1. **Download.** `pnpm exec shadcn add <url>` — the locally pinned CLI and
   `components.json` aliases point at
   `_incoming/` for UI, lib, and hook files. The CLI can also update packages, CSS, and the
   existing `cn` utility, so inspect those changes before refinement.
2. **Rebuild to the contract.** Don't polish the download; rewrite it. Most public
   components fail on `transition: all`, hardcoded durations, hex colours, and missing
   `asChild`.
3. **Tokens only.** No hex, no `slate-*`/`zinc-*`. Use semantic tokens (`bg-surface`,
   `text-muted-foreground`, `shadow-border`) by default. The ramp exceptions are status
   accents (such as warning ink and fills) and fixed neutral control states (such as
   Switch's fixed tone and Checkbox/Radio's dark resting fills).
4. **Variants + demo controls**, then an entry in `inspector/entries/` and an MDX page.
5. **Review at 4x**, then in reduced motion, then by keyboard only, then in both themes.
6. `/review-animations` and `/code-review`.

## Design foundation (`app/globals.css`)

Warm-neutral greys (hue 70, low chroma) rather than the default cold slate; a single
blue accent. Three layers: **ramps** (raw scales, used directly only for the exceptions above) →
**semantic tokens** (the default component styling roles) → **motion**.

Two colour decisions worth not re-litigating:

- **Primary is ink, not colour.** Colour is a signal; the neutral action is the default,
  while blue is reserved for the ring and other focused signals.
- **Destructive uses `oklch(0.6 0.225 26)` with white text in both themes.** The design
  reference records the contrast tradeoff; OKLCH lightness alone does not establish WCAG contrast.

Radii are **concentric**: `outer = inner + padding`. An `rounded-xl` (14px) card with
`p-1` (4px) holds `rounded-lg` (10px) children. Reusing the same radius on both is the most
common reason an interface feels subtly wrong.

**Center icon-only controls geometrically.** Measure SVG ink before adding an offset;
use `data-icon-start` / `data-icon-end` for text-button edge spacing. See the
[optical alignment reference](content/docs/reference/design.mdx#optical-alignment)
for measurement guidance.

Buttons and cards get depth from **`shadow-border`**, not `border`. A shadow is built from
transparency, so it sits correctly on any background. Keep real borders for dividers and
table cells, where the job is separation, not elevation.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
