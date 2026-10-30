---
name: two-tone-icons
description: Draw icons in a two-tone line style — 16px SVG, 1.25 strokes, round caps, surfaces filled at 30%, one solid focal mark, secondary lines at 40% — all in currentColor. Use whenever the user asks for icons in this style, "two-tone" or "duotone" icons, custom small icons for navigation, menus, lists, or titles, or wants new icons to match a set drawn this way.
---

# Two-tone icons

Small line icons with depth from opacity, not colour: a thin outline, faintly filled surfaces, one
solid mark that draws the eye, and fainter secondary lines. Everything is `currentColor`, so an icon
takes the colour of the text around it and works in any theme.

## Canvas and stroke

```svg
<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25"
     stroke-linecap="round" stroke-linejoin="round">
```

Every icon uses this outer element unchanged; only its children differ. Never hardcode a colour.

## The four paints

| Paint | Attributes | For |
| --- | --- | --- |
| Filled | `fill="currentColor" fill-opacity=".3"` (stroke kept) | A surface with an outline |
| Tone | `fill="currentColor" fill-opacity=".3" stroke="none"` | A surface without an outline |
| Solid | `fill="currentColor" stroke="none"` | The focal mark |
| Faint | `stroke-opacity=".4"` | Secondary lines |

Plain strokes (no paint) are the default outline. In code, define the four once and spread them.

## Composition

- **One subject.** Exactly one or two elements are solid or strong; the rest are outline, tone, or
  faint. An icon where everything has the same weight reads as noise at 16px.
- **Few, large parts.** Two or three lines, not five; a shape, not its details.
- **Consistent silhouettes.** Repeat the same base shapes across a set so it reads as one family:

  | Shape | Geometry |
  | --- | --- |
  | Wide frame | `rect x=1.5 y=2.5 width=13 height=11 rx=2` |
  | Bar / pill | `rect x=1.5 y=4.5 width=13 height=7 rx=2` (round ends: `rx=3.5`) |
  | Square | `rect x=2.5 y=2.5 width=11 height=11 rx=2.5` |
  | Tall frame | `rect x=1.5 y=1.5 width=13 height=13 rx=2` |
  | Line | a short horizontal stroke, e.g. `M4 8h5` |
  | Dot | `circle r=1`–`2.25`, solid |

- **Fit the grid.** Keep geometry inside 1–15 (strokes overhang by 0.625), coordinates on a 0.25
  grid, and about 1.5 units between parallel strokes so they don't merge at 16px. Inner radii are
  smaller than the frame's (0.75–1.5).

## Examples

Six worked icons are in [assets/examples/](assets/examples/), with all of them rendered in
[assets/examples.png](assets/examples.png). Three show the paints at work (outer `<svg>` omitted):

**Toggle:** a Filled surface and a Solid focal mark.

```svg
<rect x="1.5" y="4.5" width="13" height="7" rx="3.5" fill="currentColor" fill-opacity=".3"/>
<circle cx="11" cy="8" r="2" fill="currentColor" stroke="none"/>
```

**List with a selected row:** an outlined frame, a Tone highlight behind the strong line, and
Faint lines for the rest.

```svg
<rect x="1.5" y="1.5" width="13" height="13" rx="2"/>
<rect x="3" y="6.5" width="10" height="3" rx="1" fill="currentColor" fill-opacity=".3" stroke="none"/>
<path d="M4.5 4h7M4.5 12h7" stroke-opacity=".4"/>
<path d="M4.5 8h7"/>
```

**Window with a side panel:** a Tone panel drawn first, then the frame and divider stroked over
it, so the outline stays crisp.

```svg
<path d="M9.5 2.5h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3Z" fill="currentColor" fill-opacity=".3" stroke="none"/>
<rect x="1.5" y="2.5" width="13" height="11" rx="2"/>
<path d="M9.5 2.5v11"/>
```

The others: a calendar (outline, header line, one Solid day), a house (Filled body, stroked door),
and a popover (Filled panel with a strong and a Faint line, over an outlined trigger).

## Check by rendering

Look at the icons before calling them done — at 4× to judge the drawing, and at real size to judge
legibility, on both a dark and a light background:

```text
node <skill-directory>/scripts/render-icons.mjs <out.png> <icon.svg | directory>... [--size 16]
```

The script needs Sharp in the current project (Next.js projects have it). Icons written in JSX can
be written out as `.svg` files first, for example with `react-dom/server`'s
`renderToStaticMarkup`. Read the PNG and compare each icon with its neighbours for weight and size.
