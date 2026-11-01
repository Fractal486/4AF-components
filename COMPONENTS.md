# 4AF Components

## Documentation index

- [Overview](content/docs/index.mdx)
- [Generated component catalog](content/docs/reference/components.mdx)
- [Installation](content/docs/reference/installation.mdx)
- [Design system](content/docs/reference/design.mdx)
- [Engineering contract](content/docs/reference/engineering.mdx)
- [Agent skill](.agents/skills/4af-components/SKILL.md)
- [Component chooser for agents](.agents/skills/4af-components/references/component-catalog.md)

## Sources of truth

Component APIs, examples, and composition guidance belong on the matching page under
[`content/docs/`](content/docs/). The site serves each page as plain Markdown at
`/docs/<component>.md`, including its canonical install and usage examples from
[`lib/component-reference.ts`](lib/component-reference.ts).

[`registry.json`](registry.json) defines the installable catalog;
[`registry/ui/`](registry/ui/) defines the implementation and props. The website catalog and
count are generated from the registry. Demo entries illustrate usage and do not define install
boundaries.

Loading components install the shared loader utility and `ClassicLoader` as their default
indicator. See [shared loading indicators](content/docs/reference/engineering.mdx#shared-loading-indicators)
for provider overrides and alternative loaders.
Morph's hidden sizing copies reserve the loader slot without mounting its indicator.

For keyboard hints, use [Kbd and KbdGroup](content/docs/kbd.mdx#api), with platform-aware key labels, sequences, shared sizing, and context-aware colors. Command Palette, Dropdown Menu shortcuts, and Sidebar share it; Command Palette preserves its existing re-export.

For rolling numeric readouts, see [Number Animation](content/docs/number-animation.mdx#api), shared by Badge counts, Slider values, and Progress values.

For removable tags, animated counts, dots, and interactive labels, see [Badge](content/docs/badge.mdx#api).
Badge text uses Morph’s measured `current` sizing for smooth width changes, including custom button and link roots.
For inline messages with titles, descriptions, and controlled dismissal, see [Alert](content/docs/alert.mdx#api).

For custom application frames, see [Sidebar Layout's header slots](content/docs/sidebar-layout.mdx#api).
For shared hints across several triggers, cursor tracking, and separately composed popup parts,
see [Tooltip's shared and composable APIs](content/docs/tooltip.mdx#shared-tooltips).
For smoothly resizing anchored panels, shared triggers, and custom portal composition, see [Popover](content/docs/popover.mdx#api). Tall panels use Scroll Area automatically.
For shared link previews, stable placement, loading placeholders, and scrolling content, see [Hover Card](content/docs/hover-card.mdx#api). Hover Card and Popover install the shared `use-popup-height` utility for smooth sizing.
For shared row-action menus, wrapping labels, custom popup containers, and state-based row styling, see [Dropdown Menu](content/docs/dropdown-menu.mdx#api).
For notification counts, status dots, and actions that replace badges on hover, see
[Sidebar's badge and action composition](content/docs/sidebar.mdx#menu-badges-and-actions).
Sidebar also closes mobile navigation after ordinary links and supports configurable, scoped shortcuts.
For externally controlled feedback, readable error states, and manual action resets, see [Action Button](content/docs/action-button.mdx#api).
For the same feedback controls around a persistent on/off state, see [Action Toggle](content/docs/action-toggle.mdx#api).
For independent icon/background fills, custom rendering, and state-aware styling, see [Toggle](content/docs/toggle.mdx#api).
For drag gestures, optimistic saves, and shared loading indicators in an on/off control, see [Switch](content/docs/switch.mdx#saving).
For shared checkbox values, select-all parents, and nested selections, see [Checkbox groups](content/docs/checkbox.mdx#groups-and-select-all).
For custom radio rendering, state-based classes, and validation styling, see [Radio](content/docs/radio.mdx#api).
For grouped options, state-based classes, Field errors, and popup containers, see [Select](content/docs/select.mdx#api), [Select Search](content/docs/select-search.mdx#api), and [Select Aligned](content/docs/select-aligned.mdx#api).
For automatic native validation styling and character counts, see [Input](content/docs/input.mdx#validation).
For auto-growing multiline input, row limits, form wiring, and submit shortcuts, see [Textarea](content/docs/textarea.mdx#api).
For progress bars, stacked segments, or rings with a value readout, see [Progress composition](content/docs/progress.mdx#api).
For search, filters, pagination, column visibility, automatic sorting, and row selection, see [Data Table](content/docs/data-table.mdx#data-driven-tables). Its optional data model uses TanStack Table; hand-composed rows remain supported.
For pinned columns with automatic spacing and fades, wrapping text, row headings, and aligned numeric cells, see [Table](content/docs/table.mdx#api); Data Table shares these features.
For grouped headers, Table accepts `columnLayouts` for loading and empty rows; data-driven tables derive these from visible leaf columns automatically. Server pagination supports `rowCount` totals and `pageCount: -1` when the count is unknown.
For dividers with rich labels, alignment, and decorative mode, see [Separator](content/docs/separator.mdx#api).
For edge panels that adapt to viewport height and support custom surfaces, see [Sheet](content/docs/sheet.mdx#api).
For fixed dialog headers and footers around a scrolling body, shared trigger payloads, and nested layers,
see [Dialog](content/docs/dialog.mdx#api). Its portal, backdrop, and popup can also be composed separately.
[Alert Dialog](content/docs/alert-dialog.mdx#shared-dialog-parts) reuses those same parts and installs Dialog as a dependency; it adds async confirmation actions, Cancel focus, optional media, keyboard action navigation, and configurable outside dismissal.
For content-sized placeholders and text loading lines, see [Skeleton](content/docs/skeleton.mdx#api).
For compact empty states, staggered entrances, semantic headings, and rich descriptions, see [Empty](content/docs/empty.mdx#api).
For color-aware text highlights with one-time playback, active and responsive controls, see [Text Shimmer](content/docs/text-shimmer.mdx#api).
For vertical controls, draggable ranges, and formatted numeric values, see [Slider](content/docs/slider.mdx#api).
For single dates, multiple separate dates, or a continuous range, see [Date Picker](content/docs/date-picker.mdx#api).
For custom breadcrumb elements and animated expansion or collapse with focus transfer, see [Breadcrumb](content/docs/breadcrumb.mdx#api).
For disclosures with custom icons, state-based styling, and gap-aware collapsing, see [Collapsible](content/docs/collapsible.mdx#api).
For horizontal or vertical tabs, automatic overflow scrolling, icons, and custom panels, see [Tabs](content/docs/tabs.mdx#api).

When API or behavior changes, update its owning component page and canonical usage reference.
Keep this file as an index and the agent chooser focused on selecting components; link to the
owning page instead of adding another copy of its API guidance.
