# 4AF Component Catalog for Agents

Use this reference to choose components, distinguish installable items from bundled APIs,
and find the likely source files. For exact current names run `pnpm 4af list`; for exact
props inspect the implementation in `registry/ui/`.

For the complete narrative reference for one component, run `pnpm 4af docs <component>`;
it reads the matching Fumadocs page and expands its install and usage examples into plain
Markdown.

## Contents

- [Source-of-truth model](#source-of-truth-model)
- [Shared foundation](#shared-foundation)
- [Shared control geometry](#shared-control-geometry)
- [Installable catalog](#installable-catalog)
- [Bundled APIs and composition](#bundled-apis-and-composition)
- [Inspector and registry parity](#inspector-and-registry-parity)

## Source-of-truth model

| Surface | Meaning |
| --- | --- |
| Registry item | Installable source bundle named in `registry.json` and accepted by `pnpm 4af install`. |
| Export or subcomponent | API bundled inside a registry item, such as `SelectSortTrigger` inside `select`. |
| Inspector entry | Web UI demonstration. It may show a whole registry item or one specialized use. |

Use sources in this order:

1. `registry/ui/<name>/` for implementation and props.
2. `registry.json` and `pnpm 4af list` for installation names and dependencies.
3. `inspector/entries/` for demonstrations and usage examples.
4. Root `COMPONENTS.md` and this reference for orientation.

## Shared foundation

These entries install transitively:

| Item | Purpose |
| --- | --- |
| `4af-theme` | Semantic colors, typography, radii, shadows, keyframes, and motion tokens. |
| `cn` | Class composition through `clsx` and `tailwind-merge`. |
| `slot` | Local helper for `asChild` composition. |
| `motion` | Shared Motion spring and easing presets. |
| `use-action` | `useAction` — the run/pending/outcome/revert machine behind `ActionButton`, `ActionToggle`, `DropdownMenuActionItem`, and the command palette action rows. Use it directly for anything else that runs and reports. |
| `table-of-contents-scroll` | Endpoint padding, active-entry centering, and optional overflow-edge state for a constrained contents rail. |
| `table-of-contents-tracking` | Shared heading activation, visibility observation, click-to-scroll settling, and cleanup for contents variants. |

## Shared control geometry

Button controls use four text/square tiers: `xs` is 24px, `sm` is 30px, `md` is 34px, and
`lg` is 38px. Button corners are 6px at `xs`/`sm` and 8px at `md`/`lg`; the base Select and
select-aligned also use the 24px `xs` tier, while other rectangular controls keep their existing
sizes. Labeled button
content gaps are 8px at `xs`/`sm`, 10px at `md`, and 12px at `lg`, with optical edge adjustment
for leading and trailing icons.

Checkbox is the fixed exception: it has one 16px box with a 4px radius and no `size` prop.
Badge boxes keep their own size geometry and accept `shape="rounded" | "pill"`. Selection
Toolbar action controls are fixed at 24px high with 6px corners inside an 8px toolbar shell.

## Installable catalog

The catalog currently contains 46 installable UI items. Verify the count and names with
`pnpm 4af list` before making registry-wide claims.

### Actions

| Install name | Main API | Use it for |
| --- | --- | --- |
| `button` | `Button` | Primary, outline, ghost, plain, destructive, link, and icon controls; the 24/30/34/38px `xs`/`sm`/`md`/`lg` scale; loading; `asChild`; optional press scaling. |
| `button-group` | `ButtonGroup` | Joining two or more Buttons into one control: flattened inner corners, one hairline per seam, the shared Button scale including `xs`, a single outline around the run, horizontal or vertical. |
| `toggle` | `Toggle` | Base UI pressed/unpressed controls using Button visuals and sizes. |
| `morph` | `Morph` | Animated icon or text replacement that reserves stable space. |
| `action-button` | `ActionButton` | Async actions with the shared Button scale, idle/pending/success/error states, then a revert to idle; pending can keep its label or show a centered loader only without resizing. |
| `action-toggle` | `ActionToggle` | An async toggle: waits on the action, lands when it succeeds, stays put when it fails. Follow/Following, Subscribe/Subscribed. |
| `copy-button` | `CopyButton` | Clipboard actions with visual and screen-reader confirmation; `size` follows the Button scale for both labeled and icon-only forms. |
| `delete-button` | `DeleteButton` | Quiet destructive, two-step confirmation with Escape, blur, and timeout disarming; `size` follows the Button scale. |

### Fields and selection

| Install name | Main API | Use it for |
| --- | --- | --- |
| `input` | `Input` | Default, plain, and underline fields; a 34px/8px default field; an optional decorative `startIcon` on the leading edge; compact 6px number steppers; invalid/disabled states. |
| `textarea` | `Textarea` | Matching 34px/8px form treatment with an optional 16px custom resize grip using 6px corners. |
| `switch` | `Switch` | Binary on/off state with a sliding, press-squishing thumb. |
| `checkbox` | `Checkbox` | Fixed 16px/4px boolean or indeterminate selection with an animated tick and optional label; it has no size axis. |
| `radio` | `RadioGroup`, `Radio` | Single-choice selection groups. |
| `slider` | `Slider` | Numeric input with `bar`, `circle`, and `knob` thumbs, optional ticks/labels, `range` mode with two draggable thumbs, and an opt-in `showValueTooltip` that follows the active thumb during drag. |
| `select` | `Select`, trigger/content/item/separator parts, `SelectSortTrigger`, `SelectSub` parts | Base UI single/multi select with 24px `xs`, 30px `sm`, and 34px `md` trigger/row sizes, optional panel search and clear footer, compact sort/filter trigger, accessible separators, and nested option panels. |
| `select-aligned` | `AlignedSelect` and trigger/content/item/group parts | A select that opens *on* its trigger: default/ghost panel at the trigger's width, plain panel at the longest row plus check slot, selected row landing on the value it replaces, `ChevronsUpDown` glyph, and an `xs` size with a 24px trigger and popup rows. The macOS pop-up button. |
| `select-search` | `SearchSelect` and input/content/item parts | Editable Combobox trigger with filtering and single/multi selection. |
| `select-motion` | `Select` and trigger/content/item parts | Button-triggered select with a hand-animated unfolding panel and optional panel search. |
| `select-motion-search` | `MotionSearchSelect` and parts | Editable Combobox whose panel unfolds from the field. |

### Feedback and status

| Install name | Main API | Use it for |
| --- | --- | --- |
| `progress` | `Progress`, `ProgressLabel`, `ProgressValue` | Determinate progress with transform-driven fill. |
| `alert` | `Alert` | Inline status line (glyph + sentence, no surface): `error` (hexagon, `role="alert"`), `warning` (amber triangle), `success` (green check), `info` (neutral), `loading` (muted ASCII spinner); not tied to field context. |
| `badge` | `Badge` | Outline/status labels with optional icon or dot, animated content changes, and `shape="rounded" | "pill"` for boxed variants. |
| `skeleton` | `Skeleton` | Generic loading placeholders, square and shaped entirely by utility classes — there is no shape axis, and corners are opt-in; animation respects reduced motion. |
| `empty` | `Empty` and composition parts | Empty states with optional dashed placeholder treatment. |
| `text-shimmer` | `TextShimmer` | Theme-aware looping highlight for working labels. |
| `scramble-text` | `ScrambleText` | Reveals text through a short per-grapheme scramble animation, preserving whitespace and honoring reduced motion. |
| `toast` | `ToastProvider`, `useToast`, `createToastManager` | Managed notifications with default or title-only content, swipe dismissal, placement/stack modes, and up to three actions. |
| `ascii-loader` | `AsciiLoader` | A looping braille spinner for compact async status affordances. |

### Navigation and application structure

| Install name | Main API | Use it for |
| --- | --- | --- |
| `tabs` | `Tabs`, `TabsList`, `TabsTab`, `TabsPanel` | Segment, pill, or underline tabs with a traveling indicator; segment tracks use 8px corners and their tabs use 6px corners. |
| `collapsible` | `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` | Disclosure rows (`plain`/`card`) with a rotating chevron, shared 6px plain or 8px card trigger corners, a height slide so following rows travel rather than jump, and a blur-fade on the content. |
| `table` | `Table`, `TableCaption`, and header/body/footer/row/head/cell parts | Presentational tables in two densities (`sm` by default), with a pinned header, optional grid lines, a caption pinned below the scrolling box, and a loading state. No controls and no state — install `data-table` for any of those. |
| `data-table` | `DataTable`, `DataTableRow`, `DataTableHead`, `DataTableRowActions`, plus the re-exported table layout parts | The stateful table: checkbox column with an indeterminate select-all, a selection action row over the header taking compact 24px Button actions, three-step `sortKey` sorting with `ChevronsUpDown` when unsorted, and a per-row actions column. Composes `table`. |
| `table-of-contents` | `TableOfContents` | Heading navigation with a dashed inactive rail, smooth document scrolling, long-prose fallback, and `span` or `single` active marker variants. `labels="hover"` withholds the headings until the list is hovered or focused, leaving only the rail. A height-constrained rail hides its browser scrollbar and smoothly centers every active entry, including endpoints; pass `rootRef` for an independently scrolling article. |
| `table-of-contents-lines` | `TableOfContentsLines` | Dense line-based heading navigation with one active heading, a longer header rule, equal shorter rules between headings (none below the final heading), heading-relative indentation, and an expanding hover treatment. `labels="hover"` withholds the headings until the list is hovered or focused, leaving only the rules. A height-constrained rail hides its browser scrollbar and smoothly centers every active entry, including endpoints; pass `rootRef` for an independently scrolling article. |
| `separator` | `Separator` | An accessible horizontal or vertical divider built on Base UI Separator. |
| `command-palette` | `CommandPalette`, panel/list/row/footer parts, and `useCommandSearch` | Fuzzy command search, groups, nested/custom panels, async/server-driven search, configurable headers, 6px compact header navigation controls, keybinds (default ⌘K/Ctrl+K), selection, actions, and Dialog-style enter/exit motion. |
| `sidebar` | Provider, panel, group/menu/submenu/action/badge/skeleton parts | Default/floating/inset and split/split-floating/split-inset sidebars, collapse, collapsible rows with built-in chevrons, nested rows, split rail/panel selection, actions, badges, skeletons, and shared 6px/8px menu and rail radii. |
| `sidebar-layout` | `SidebarLayout` | Optional page shell around Sidebar with inset surface, title, collapse control, and actions. |

### Overlays and menus

| Install name | Main API | Use it for |
| --- | --- | --- |
| `tooltip` | `TooltipProvider`, `Tooltip` | Delayed hover/focus descriptions with collision-aware placement, optional controlled `open`, press behavior, and hoverable-popup control. |
| `sheet` | `Sheet` and composition parts | Focus-trapped edge dialogs. |
| `dialog` | `Dialog` parts, `DialogSteps`, `DialogStep` | Centered modals and optional validated multi-step flows. |
| `alert-dialog` | `AlertDialog` parts | Decision-forcing modal that cannot dismiss by clicking away. |
| `popover` | `Popover` parts | Interactive anchored panels with optional modal behavior. |
| `selection-toolbar` | `SelectionToolbar`, button/action-button/toggle/action-toggle/toggle-group/separator parts | Actions over selected text — copy, highlight, quote. Anchored to the range, hands the captured text and range to every action. Its Button-like actions are fixed at 24px high with 6px corners inside an 8px shell. Plain items dismiss the bar on press; async and toggle items keep it up so their state is visible. |
| `hover-card` | `HoverCard`, trigger/content parts, `HoverCardSkeleton` | Rich previews opened by hover or keyboard focus, with built-in loading placeholders. |
| `dropdown-menu` | Menu, checkbox/radio/submenu, shortcut, and nested-select parts | Keyboard menus, safe submenus, destructive items, Kbd hints, searchable selection panels, and immediate disabled-reason tooltips. |

## Bundled APIs and composition

Public features, not separate install names.

### Alert

No surface, no field context — use it for any short inline status. Under a field, connect
with `aria-describedby` and mark the field invalid.

| Variant | Ink | Glyph | Role |
| --- | --- | --- | --- |
| `error` (default) | Destructive | Hexagon | `alert` |
| `warning` | Amber accent | Triangle | `status` |
| `success` | Success green | Check | `status` |
| `info` | Foreground ink | Info | `status` |
| `loading` | Muted grey | ASCII spinner | `status` |

Set `variant`; do not restyle one variant to imitate another — the role and glyph do not
follow the colour. Pulls in `ascii-loader`. Renamed from `FieldError`/`field-error`: a
deprecated `FieldError` alias still compiles, but the install name is `alert`.

### Async work

Every waiting state is the ASCII loader. `Button` exports a deprecated SVG `Spinner`; do
not use it.

| After the work | Use |
| --- | --- |
| Reverts to how it was | `action-button` (`copy-button` for the clipboard) |
| Lands in a new state | `action-toggle` |
| Runs inside a menu | `DropdownMenuActionItem` |
| Anything else | `useAction` directly |

`ActionButton` always reverts — `revertAfter={Infinity}` clamps to a 32-bit int and fires
almost immediately. `ActionToggle` is not optimistic: the label holds until the action
settles and `onPressedChange` fires only on success.

Glyph and label morph in separate boxes (the loader is a text glyph, far narrower than an
icon; morphing them together slides the label). So a label with no per-state override does
not animate — pass `labels={{ pending: … }}` only when the word should change. `ActionToggle`
with `fillIcon` and no `icons.pressed` does not swap the glyph either; the fill is the
animation. `ActionButton` additionally takes `pendingMode="icon"` to hide the pending label and
centre the loader over the reserved label-sized content box; the default `"label"` mode keeps
the pending label beside it. Do not wrap the label and icon in one `Morph` when building
something similar.

### Press scaling

`Button` and `Toggle` take `pressScale={false}` — for anchored triggers whose popup would
appear to move. `Button` takes `pressTarget="content"` when its edges are joined to a
neighbour's; `ButtonGroup` sets it already. `ActionButton`, `CopyButton`, and
`DeleteButton` inherit both.

### ButtonGroup

Takes plain `Button` children and clones them for position, `variant`/`size` defaults, and
press target. The group owns the single outline; the buttons drop theirs. It is
`role="group"` and every button keeps its own tab stop — for selecting between options use
`tabs`.

### Badge

`animateLayout={false}` for a static badge in a list that filters or reorders; otherwise
the pill FLIP-animates as the row moves.

### Input

`startIcon` takes any node and pins it inside the leading edge of the field; omit it and the
component renders the bare `<input>` with no wrapper element at all. The glyph is decorative —
`aria-hidden`, `pointer-events-none`, 16px — so it never earns a name and never steals the click
that focuses the field. Still label the input itself; do not treat the icon as the label.

The field carries `data-icon-start` and takes its leading padding from that attribute, so the
padding follows the icon rather than a caller-supplied `className`. `default` and `plain` sit the
glyph at the field's 12px inset; `underline` has no horizontal padding, so it goes flush. A number
field composes with it: the icon owns the leading edge, the steppers keep the trailing one, and
both share the single `data-slot="input-wrapper"` span.

### Select family

`SelectSortTrigger` ships inside `select` (there is no `select-sort` item); `clearable` on
`SelectContent` adds the clear footer — a compact `xs` ghost reset button with a `SelectSeparator`
above it by default. `SelectSub`, `SelectSubTrigger`, and `SelectSubContent` add nested panels whose child
`SelectItem`s use the parent select's value and check state; multi-select submenu triggers show a
dimmed selected-child count before their chevron.

| Install name | Trigger | Panel entrance | Search location |
| --- | --- | --- | --- |
| `select` | Button/field | Scale, blur, fade | Optional inside panel |
| `select-search` | Editable Combobox | Standard positioned panel | Trigger field |
| `select-aligned` | Button/field | Fade, opening *over* the trigger | Optional pinned field |
| `select-motion` | Button/field | Unfolding panel | Optional inside panel |
| `select-motion-search` | Editable Combobox | Unfolds from field | Trigger field |

All support single and multi selection (multi uses Checkbox) and take `size="sm" | "md"`,
default `sm`. `sm` is a 30px control with compact text and 14px glyphs; `md` is 34px and lines
up with a medium Button or Input in a form row; the size scales the trigger and the option
rows together, with 6px corners at `sm` and 8px at `md`. Inside a Command Palette keep `sm`.
The base `select` and `select-aligned` additionally accept `size="xs"`, which scales both the
trigger and option rows to 24px with 6px corners.
`select-aligned` is single selection only. It takes optional sections
(`AlignedSelectGroup` + `AlignedSelectGroupLabel`, which hide themselves when a search empties
them) and an optional pinned search field (`searchable` on the content).

`select`'s `SelectTrigger` and `SelectSortTrigger`, plus `select-aligned`'s
`AlignedSelectTrigger`, accept `variant="default" | "ghost" | "plain"`. `ghost` uses Button's
muted ghost colors while keeping the default trigger geometry, so icons stay aligned. `plain`
removes the trigger surface, border, and horizontal padding, leaving the label/value and dropdown
glyph adjacent.
`SelectTrigger` and `AlignedSelectTrigger` also accept an optional dimmed `label` before the value;
for example, `label="Fruit"` displays `Fruit: Banana`.
The older `outline={false}` prop remains a compatibility alias for `variant="plain"`.
When panel `width` is omitted, default and ghost triggers keep a trigger-width panel and plain
triggers use the longest row plus the reserved check slot; pass `width="trigger" | "content"` to
override it.

Every panel in the family opens with a row already active, before anything is typed: the
current selection where there is one (the most recent, when several are chosen), otherwise the
first row, and the top match once a query narrows the list. Hovering moves the mark; leaving the
panel keeps it. The mark is `data-panel-active`; the search variants use Base UI's
`data-highlighted` via `autoHighlight` plus `keepHighlight`, where `"always"` is only for a
select with nothing chosen because it pins row one over the selection. `autoFocusFirstItem={false}` opts out, for
menu-like uses such as a sort control.

`select-aligned` overlaps the trigger through Base UI's `alignItemWithTrigger`, which applies
to pointer input only and switches off when there is no room — it falls back to an ordinary
dropdown, so do not try to force it. Row padding plus panel padding equals the trigger's
padding, and that is what lines the selected label up with the value it covers; restyle one and
restyle all three.

For an icon on a closed trigger before the panel has ever opened:

- `select` — put `icon` in the `items` array (array form only; the record form is
  `{ value: label }`).
- `select-search`, `select-motion-search` — put `icon` on the item data; the item *is* the
  value. Do not widen their `items` type or key a lookup on `item.value`.
- `select-motion` — nothing needed; its items are always mounted.

Order: mounted item, then `iconForValue`, then `items`/the value. An icon passed only to
the item element cannot resolve before mount.

### Command Palette

Root groups/rows, nested lists, custom panels via `helpers.openPanel`, search or
text-field panel headers, per-panel header actions, badges, checkboxes, Kbd hints,
destructive states, action panels.

Enter and exit mirror Dialog: the backdrop fades, the panel scales in from a small blur,
and the exit fades and blurs without reversing the entrance. Use `keepMounted`/
`AnimatePresence` and honor reduced motion.

The root `shortcut` prop defaults to `true` (`⌘K` / `Ctrl+K`). The inspector demo turns that
binding off on the component and uses `⌘⇧P` / `Ctrl+Shift+P` instead so it does not compete with
Fumadocs' own command shortcut.

Every list — the root list and every custom panel's — opens with its first row already
selected, before anything is typed, and follows the new first row as a query narrows the list;
Enter runs it without an arrow press. Selection and hover are separate: the selected row carries
`data-highlighted` and moves on arrow keys or a press, while hover is a weaker fill only, so
sweeping the cursor never changes what Enter runs. A row whose actions menu is open carries
`data-frozen`, styled identically.

The root list primes that first row from its `items` collection via `autoHighlight`. A custom
panel has no such collection, so `CommandPanelList` primes its own first row from the DOM after
commit — do not remove that, and do not assume `autoHighlight` covers panels.

Escape clears a non-empty header field only when that header is `type="search"`; other
headers go back. Keep Select controls in headers at `size="sm"`.

Actions rows take four shapes as item fields. The first three are the dropdown menu's, and
keep the menu open: `action` alone runs/confirms/reverts; `action` +
`checked`/`defaultChecked` lands in the new state; `checked`/`defaultChecked` alone flips
at once. The fourth is `DeleteButton`'s: `confirm` arms on the first press and runs
`onSelect` and closes on the second, disarming on Escape, on the menu closing, or after
`confirm.resetAfter` (3s; `0` never).

`labels`/`icons` supply the `checked`, `pending`, `success` and `error` states;
`revertAfter` and `pendingDelay` as on `ActionButton`. An item with none of these fields
closes the menu and calls `onSelect`.

Async root results: `onSearch(query, signal) => Promise<CommandGroup[]>`, with `groups` as
the resting state while the query is empty. Returned order is preserved. Tune with
`searchDebounce`, `loadingMessage`, and `searchErrorMessage`; debounce, abort,
out-of-order dropping, loading, and rejected searches are handled. In a custom panel call
`useCommandSearch(helpers.query, source)`, render `CommandPanelLoading` while
`searching && results === null`, and use the returned `error` for a panel-specific failure
state.

A custom panel's footer has two optional slots on the right and nothing else: `enter` (the
primary action, always the return key) and `actions` (the contextual menu, always Cmd/Ctrl+J).
Neither chord is configurable, and there is no children slot — do not try to put a third
affordance in that corner.

### Dropdown Menu

Three nested-panel forms: navigation submenu, single-select with a trailing checkmark, and
checkbox multi-select. Selection panels can search. Safe pointer travel keeps the parent
active on the way into a panel.

Select-style triggers keep their label or placeholder on the left and show the selected value or
count, dimmed, before the chevron. Their optional search field is text-only, and the no-results
state matches the height of one select row.

Disabled rows accept an optional `disabledReason`. The disabled row itself becomes an immediate
right-side tooltip trigger on hover, while remaining unavailable for selection:

```tsx
<DropdownMenuItem disabled disabledReason="Billing is available on the Pro plan.">
  Billing
</DropdownMenuItem>
```

`DropdownMenuCheckboxItem` takes `children` as `(checked, status) => …` and
`indicator={false}` to drop the tick, so the icon and label carry the state. Wrap swapping
parts in `Morph`; use `fillIcon` when only the glyph's weight changes. Rows already
left-align Morphs and mute a morphing leading icon — do not set `place-items-start` or a
text colour.

| Row behaviour | Use |
| --- | --- |
| Runs, confirms, reverts | `DropdownMenuActionItem` (`closeOnClick={false}` by default) |
| Runs, then lands checked | `DropdownMenuCheckboxItem` with `action` |
| Flips immediately | `DropdownMenuCheckboxItem`, no `action` |

Do not hand-roll either with `useState` and `setTimeout`; both run on `useAction`.

### Selection Toolbar

Item kinds mirror the menu's rows. Use the part, don't rebuild it on `SelectionToolbarButton`.

| Item | Wraps | Dismisses the bar |
| --- | --- | --- |
| `SelectionToolbarButton` | `Button` | Yes (`keepOpen` opts out) |
| `SelectionToolbarActionButton` | `ActionButton` | No (`closeOnSuccess` opts in) |
| `SelectionToolbarToggle` | `Toggle` | Never |
| `SelectionToolbarActionToggle` | `ActionToggle` | Never |
| `SelectionToolbarToggleGroup` | Base UI `ToggleGroup` | — |

Async and toggle items keep the bar up because that is where their state is drawn. Every
action receives the captured `(text, range)` — never call `window.getSelection()` inside one.
`variant="destructive"` is quieted to red ink automatically; do not add a red fill.

For an item whose state depends on the selection, write a small component and call
`useSelectionToolbar()` inside it — it renders within the bar even though it is created
outside, so the hook reads the right selection.

### Sidebar

`sidebar` covers default, floating, inset, and split forms, collapsible sections, row
actions, badges, nested rows, search/button headers, and row skeletons. Use
`SidebarMenuCollapsible` for an expandable row; `SidebarMenuCollapsibleTrigger` includes a
trailing `ChevronDown` by default and accepts `chevron={false}` when a custom indicator is
needed. A sibling `SidebarMenuAction` is placed before that chevron, and a sibling
`SidebarMenuBadge` reserves a slot before both controls so counters do not overlap them. Hovering
nested rows keeps the highlight on the row under the pointer rather than highlighting the
collapsible parent.
`SidebarGroup` is visual grouping only. Compose a row action with `dropdown-menu`.

Split variants are `split`, `split-floating`, and `split-inset`. Provide the fixed `rail` with
`SidebarRailButton` controls and `SidebarPanel` sections; use `activePanel`,
`defaultActivePanel`, and `onActivePanelChange` when the wide panel selection needs to be
controlled or observed.

A header takes one full-width `SidebarHeaderButton`, or two wrapped in `SidebarHeaderRow`,
which splits the width and stacks them when the sidebar collapses; `className="flex-none"`
opts a button out.

`sidebar` is the low-level navigation family and `sidebar-layout` the optional frame around
it; they stay separate so a consumer can take the responsive sidebar without also taking one
viewport and scrolling strategy.

`sidebar-layout` is the optional shell: content surface, page header, collapse control,
title, header actions.

### Table and Data Table

Two installable items, split on state. `table` is presentation only — markup, densities,
`bordered`, `stickyHeader`, `TableCaption`, `loading`, the scroll container — with no controls and
no Motion, Lucide or Checkbox. `data-table` adds every control and composes `table`.

Install `table` if the table only presents rows; `data-table` the moment it needs a checkbox, a
sort control or a row menu. Do not add controls to `table`.

`data-table` re-exports `TableCaption`, `TableHeader`, `TableBody`, `TableFooter` and `TableCell`
unchanged. `DataTableRow` replaces `TableRow`; `DataTableHead` replaces `TableHead` and must be
used for **every** header cell, sortable or not, or the label will not fade under the selection bar.

| Need | Item | Prop |
| --- | --- | --- |
| Density, grid lines, pinned header, caption | `table` | `size` (`sm` 36px rows, `md` 44px, both with a 36px header), `bordered`, `stickyHeader`, `TableCaption` first |
| Loading placeholders | either | `loading` (+ `loadingRows`); shape is read off the header, sets `aria-busy` |
| Checkbox column | `data-table` | `selectable` |
| What select-all covers | `data-table` | `rows` (the page you are rendering, not every row you have) |
| Selection state | `data-table` | `value` / `onValueChange`, or `defaultValue` |
| Name a row's checkbox | `data-table` | `selectLabel` on `DataTableRow` |
| Header becomes an action row while selecting | `data-table` | `selectionBar` + `selectionActions` (needs `selectable`) |
| Sortable column | `data-table` | `sortKey` on `DataTableHead` |
| Per-row menu | `data-table` | `actionColumn` on the root + `actions` on each `DataTableRow` |

Columns are opened on the **root**, never per row: `selectable` and `actionColumn` add the gutter
cells to every row, header and placeholders included. Do not write those cells by hand.

Sorting cycles ascending → descending → unsorted; switching columns restarts at ascending. The
component owns the control, the state and `aria-sort` and reports `{ column, direction } | null` —
order the rows yourself.

`selectionBar` swaps the labels for an `N selected` count with `selectionActions` at the right end,
keeping the select-all in place. The count covers the whole selection, not only the part `rows`
covers; use `xs` Buttons. A row is selectable when it has a `value`; one without still gets an
empty cell so columns stay aligned. Select-all is a union. Rows expose `data-selected`, not
`aria-selected`, which is invalid on a plain table row.

For the row menu use `DataTableRowActions` — it owns the trigger and takes `DropdownMenuItem`
children; do not hand-roll one. Its `label` is required: give it the row's subject. The contents
are hidden until the row is hovered, and also shown on visible focus in the row, while the menu is
open, and where the pointer has no hover; selection does not reveal them.

### Toast

`actions` for up to three buttons; `actionProps` remains for one.

## Inspector and registry parity

The inspector is a review site, not the installable catalog. `sidebar-layout` appears
inside the Sidebar demo, and the two Table of Contents entries share one stacked page while using
separate demo canvases. The "Select · Sort" entry demonstrates `SelectSortTrigger`
(install `select`). Demo helpers, sample data, navigation, settings controls, and page
wrappers are not registry components.
