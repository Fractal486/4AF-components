---
name: component-blueprint
description: Create a hand-authored, animated SVG spacing blueprint for a named UI component in the current project. Use for component blueprints, measured component drawings, or SVG diagrams of sizes, padding, and gaps; not for implementing or redesigning the component itself.
---

# Component blueprint

Given only a component name, inspect its implementation and produce an SVG in the visual style below. Make the layout and content choices yourself; no reference image, design brief, or follow-up questions are needed when the component source is available.

This is a coded vector drawing, not an image-generation task. Write SVG geometry and text directly. Do not generate, trace, or embed a raster image.

## Find the component and its measurements

Work in the user's current project. Resolve the supplied name through its component files, registry/catalog, documentation, or demo. In 4AF, `registry.json` lists all files for an installable item; inspect sibling implementation and variant files, the matching `inspector/entries/` demo, and relevant tokens in `app/globals.css`. Read only what is needed to establish the pictured state and geometry.

Use the ordinary default variant and size. Show the component in the state that explains it: a popup open, one tab selected, a slider at a representative value. Use about five realistic entries for list surfaces when appropriate; this is not a requirement for unrelated components. Default to short familiar labels such as Dashboard, Projects, Team, Activity, and Settings. Preserve meaningful component content, such as a command palette's search field and keyboard footer.

Derive sizes from source, not from the example drawings. Resolve spacing tokens, font line heights, border widths, padding, and gaps. Account for box sizing: a row with 20px line height and 8px vertical padding is 36px high. Distinguish `min-height`, fixed height, and content-dependent size. If width is flexible, choose a representative valid width or its configured maximum; record that choice in an SVG comment rather than implying it is universal. Never label a maximum as the current width unless the drawing actually uses it.

If the component cannot be located, report that specific missing source instead of inventing measurements. A name alone is enough input within a project that contains the component; it is not evidence of an unknown implementation.

## Draw the approved style

Use [the Select Aligned example](assets/select-aligned.svg) for compact controls or [the Command Palette example](assets/command-palette.svg) for larger panels. Read the closer example to see the composition and CSS; the other is optional. The examples are templates for visual treatment, not dimensions to reuse blindly.

- One centered component drawing on the app's dark base background. Read the current app token; the 4AF fallback is `#060606` (the 8-bit equivalent of `oklch(0.120 0 0)`). Use the same background for icon knockouts. Do not add a presentation card, heading, title block, page border, legend, footer commentary, or branding around the drawing.
- Muted gray component outlines (`#a7a8a2`), gray text (`#92948d`), brighter selected text (`#c7c7c2`), and a restrained active fill (`#353632`). These are illustration inks, not a demand to reproduce every production surface color. Component structure should remain recognizable.
- All ruler strokes, extension lines, and spacing guides are blue (`#6889ff`). Use approximately 1.5 SVG-unit ruler strokes, 2–3-unit component strokes, and `6 7` dashes at about `.55` opacity for spacing overlays.
- Dashed overlays show the actual padding edges, text/icon insets, and row boundaries or gaps. These guides stay on top of surfaces; place them behind text where practical. Keep them visible in the finished illustration.
- Label measurements with just the number and unit: `36 px`, `6 px`, `0 px`. No prose such as “row padding,” equations, API names, transform origins, or animation specifications. Every measurement belongs beside a ruler or a connected leader. One short connected behavior note is appropriate only when it explains the component's defining placement, e.g. “Panel opens over the trigger.”
- Use simple perpendicular end ticks and short leaders. Make ruler endpoints correspond to the exact geometry being measured. Show the useful dimensions without measuring every repeated row. Do not add artificial gaps: adjacent rows may have a `0 px` gap.
- Use a plain sans-serif stack (`Inter, 'Segoe UI', Arial, sans-serif`), not a technical monospace treatment. No crosshairs, editor selection handles, glow, texture, or decorative grids.

Choose a consistent drawing scale, usually 2× for wide surfaces or 3× for compact ones. Scale geometry and component text together, but labels measure the original CSS pixels. Give rulers and labels enough surrounding space; adjust the viewBox instead of squeezing them. Keep all visible text inside it. Do not stretch the component to match the examples' aspect ratios.

Add an accessible SVG `title` and `desc` (not visible headings). Keep source paths, the chosen size/state, drawing scale, and dimension arithmetic in comments so the measurements can be maintained. Use unique IDs/prefixes if the asset may be inlined beside another SVG. Keep the SVG self-contained with no scripts, external stylesheets, external images, or font downloads.

## Animate once, in two phases

Use embedded CSS only. Keep component text and fills visible throughout. Draw the component's solid outline and icon/divider strokes first; then fade in all blue guides, rulers, and measurement labels together. Never animate the dashes travelling indefinitely.

The approved complete sequence is **900ms**:

- Outer outline: 400ms, starting immediately.
- Smaller component strokes: 200ms each, staggered by 25ms where useful, with the last finishing by 650ms. Select Aligned's check starts at 400ms; the larger palette's details run from 250–450ms.
- Guides, rulers, and measurement labels: fade from 0 opacity for 200ms, starting at 700ms. Preserve each element's final opacity, including `.55` guides and `.7` trigger outlines.

Normalize each drawn SVG geometry with `pathLength="1"`. Animate `stroke-dashoffset` from `1` to `0` with `stroke-dasharray: 1` and `ease-out`. Split disconnected paths when they should draw separately. For reusable icons, put `pathLength` on each stroked child and inherit the delay from its `use` instance.

Put animation rules inside `@media (prefers-reduced-motion: no-preference)`. Outside it, all elements are fully visible with their intended final dashes/opacities. For the annotation fade, a keyframe containing only `from { opacity: 0; }` lets the end resolve to each element's own opacity. Use `both` fill mode so delayed elements remain hidden until their turn. There is no loop or replay control; reopening the SVG replays it. The bundled SVGs contain the complete working CSS pattern.

## Save and inspect

Save `<component-name>.svg` under `public/blueprints/<sidebar-section>/` when the project has a public-assets directory; otherwise use `artifacts/blueprints/<sidebar-section>/`. Match the actual sidebar section and use its lowercase hyphenated name for the folder. In 4AF, `lib/site-nav.ts` uses `COMPONENT_CATEGORIES` from `lib/component-catalog.ts` (not `COMPONENT_FAMILIES`); examples are `fields-and-selection`, `navigation-and-layout`, and `overlays-and-menus`. Keep each PNG beside its SVG. If the project has no sidebar grouping, omit the section folder. Honor an explicitly supplied output directory. Do not wire the asset into the app, edit the component, run a full build, or publish anything as part of this task.

Also produce a static PNG of the completed drawing when a local renderer is available:

```text
node <skill-directory>/scripts/render-preview.mjs <path-to-svg>
```

Run from the project root. The helper uses the project's existing Sharp dependency (including Next's copy), writes alongside the SVG, and replaces outputs via a temporary file to avoid Windows renderer overwrite issues. It installs nothing. If unavailable, use an existing local SVG renderer; the SVG is still the required deliverable.

Inspect the rendered PNG directly with the image-viewing tool for clipping, label collisions, ruler accuracy, and balanced margins. Do not use a browser, headless browser, Playwright, or CDP for this workflow. Review animation timing and reduced-motion handling in the SVG source; the PNG shows only the finished static drawing. Do not add project tests for the illustration.

Return concise links to the SVG and PNG, if produced. Mention missing verification only if it materially limits confidence; do not substitute a long explanation for the assets.
