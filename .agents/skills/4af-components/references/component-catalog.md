# 4AF Component Catalog for Agents

Use this reference to choose components, distinguish installable items from bundled APIs,
and find the likely source files. For exact current names run `pnpm 4af list`; for exact
props inspect the implementation in `registry/ui/`.

## Contents

- [Source-of-truth model](#source-of-truth-model)
- [Shared foundation](#shared-foundation)
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

## Installable catalog

The catalog currently contains 41 installable UI items. Verify the count and names with
`pnpm 4af list` before making registry-wide claims.

### Actions

| Install name | Main API | Use it for |
| --- | --- | --- |
| `button` | `Button` | Primary, outline, ghost, plain, destructive, link, and icon controls; loading; `asChild`; optional press scaling. |
| `button-group` | `ButtonGroup` | Joining two or more Buttons into one control: flattened inner corners, one hairline per seam, a single outline around the run, horizontal or vertical. |
| `toggle` | `Toggle` | Base UI pressed/unpressed controls using Button visuals and sizes. |
| `morph` | `Morph` | Animated icon or text replacement that reserves stable space. |
| `action-button` | `ActionButton` | Async actions with idle, pending, success, and error states, then a revert to idle. |
| `action-toggle` | `ActionToggle` | An async toggle: waits on the action, lands when it succeeds, stays put when it fails. Follow/Following, Subscribe/Subscribed. |
| `copy-button` | `CopyButton` | Clipboard actions with visual and screen-reader confirmation. |
| `delete-button` | `DeleteButton` | Quiet destructive, two-step confirmation with Escape, blur, and timeout disarming. |

### Fields and selection

| Install name | Main API | Use it for |
| --- | --- | --- |
| `input` | `Input` | Default, plain, and underline fields; number steppers; invalid/disabled states. |
| `textarea` | `Textarea` | Matching multiline fields with an optional custom resize grip. |
| `switch` | `Switch` | Binary on/off state with a sliding, press-squishing thumb. |
| `checkbox` | `Checkbox` | Boolean or indeterminate selection with animated tick and optional label. |
| `radio` | `RadioGroup`, `Radio` | Single-choice selection groups. |
| `slider` | `Slider` | Numeric input with `bar`, `circle`, and `knob` thumb variants. |
| `select` | `Select`, trigger/content/item parts, `SelectSortTrigger` | Base UI single/multi select, optional panel search and clear footer, compact sort/filter trigger. |
| `select-search` | `SearchSelect` and input/content/item parts | Editable Combobox trigger with filtering and single/multi selection. |
| `select-motion` | `Select` and trigger/content/item parts | Button-triggered select with a hand-animated unfolding panel and optional panel search. |
| `select-motion-search` | `MotionSearchSelect` and parts | Editable Combobox whose panel unfolds from the field. |

### Feedback and status

| Install name | Main API | Use it for |
| --- | --- | --- |
| `progress` | `Progress`, `ProgressLabel`, `ProgressValue` | Determinate progress with transform-driven fill. |
| `alert` | `Alert` | Inline status line (glyph + sentence, no surface): `error` (hexagon, `role="alert"`), `warning` (amber triangle), `success` (green check), `info` (neutral), `loading` (muted ASCII spinner); not tied to field context. |
| `badge` | `Badge` | Outline/status labels with optional icon or dot and animated content changes. |
| `skeleton` | `Skeleton` | Generic loading placeholders; animation respects reduced motion. |
| `empty` | `Empty` and composition parts | Empty states with optional dashed placeholder treatment. |
| `text-shimmer` | `TextShimmer` | Theme-aware looping highlight for working labels. |
| `toast` | `ToastProvider`, `useToast`, `createToastManager` | Managed notifications, swipe dismissal, placement/stack modes, and up to three actions. |

### Navigation and application structure

| Install name | Main API | Use it for |
| --- | --- | --- |
| `tabs` | `Tabs`, `TabsList`, `TabsTab`, `TabsPanel` | Segment, pill, or underline tabs with a traveling indicator. |
| `collapsible` | `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` | Disclosure rows (`plain`/`card`) with a rotating chevron, a height slide so following rows travel rather than jump, and a blur-fade on the content. |
| `table-of-contents` | `TableOfContents` | Observed heading navigation with smooth scrolling and active marker. |
| `command-palette` | `CommandPalette`, panel/list/row/action parts, and `useCommandSearch` | Fuzzy command search, groups, nested/custom panels, async/server-driven search, configurable headers, keybinds, selection, and actions. |
| `sidebar` | Provider, panel, group/menu/submenu/action/badge/skeleton parts | Default/floating/inset and split sidebars, collapse, sections, nested rows, actions, badges, skeletons. |
| `sidebar-layout` | `SidebarLayout` | Optional page shell around Sidebar with inset surface, title, collapse control, and actions. |

### Overlays and menus

| Install name | Main API | Use it for |
| --- | --- | --- |
| `tooltip` | `TooltipProvider`, `Tooltip` | Delayed hover/focus descriptions with collision-aware placement. |
| `sheet` | `Sheet` and composition parts | Focus-trapped edge dialogs. |
| `dialog` | `Dialog` parts, `DialogSteps`, `DialogStep` | Centered modals and optional validated multi-step flows. |
| `alert-dialog` | `AlertDialog` parts | Decision-forcing modal that cannot dismiss by clicking away. |
| `popover` | `Popover` parts | Interactive anchored panels with optional modal behavior. |
| `selection-toolbar` | `SelectionToolbar`, button/action-button/toggle/action-toggle/toggle-group/separator parts | Actions over selected text — copy, highlight, quote. Anchored to the range, hands the captured text and range to every action. Plain items dismiss the bar on press; async and toggle items keep it up so their state is visible. |
| `hover-card` | `HoverCard`, trigger/content parts, `HoverCardSkeleton` | Rich previews opened by hover or keyboard focus, with built-in loading placeholders. |
| `dropdown-menu` | Menu, checkbox/radio/submenu, shortcut, and nested-select parts | Keyboard menus, safe submenus, destructive items, Kbd hints, and searchable selection panels. |

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

### Select family

`SelectSortTrigger` ships inside `select` (there is no `select-sort` item); `clearable` on
`SelectContent` adds the clear footer.

| Install name | Trigger | Panel entrance | Search location |
| --- | --- | --- | --- |
| `select` | Button/field | Scale, blur, fade | Optional inside panel |
| `select-search` | Editable Combobox | Standard positioned panel | Trigger field |
| `select-motion` | Button/field | Unfolding panel | Optional inside panel |
| `select-motion-search` | Editable Combobox | Unfolds from field | Trigger field |

All support single and multi selection (multi uses Checkbox) and take `size="sm" | "md"`,
default `sm`. Inside a Command Palette keep `sm`.

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

No enter or exit animation, deliberately — do not add one, or `keepMounted`/
`AnimatePresence`.

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

### Dropdown Menu

Three nested-panel forms: navigation submenu, single-select with a trailing checkmark, and
checkbox multi-select. Selection panels can search. Safe pointer travel keeps the parent
active on the way into a panel.

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

### Sidebar

`sidebar` covers default, floating, inset, and split forms, collapsible sections, row
actions, badges, nested rows, search/button headers, and row skeletons. Compose a row
action with `dropdown-menu`.

A header takes one full-width `SidebarHeaderButton`, or two wrapped in `SidebarHeaderRow`,
which splits the width and stacks them when the sidebar collapses; `className="flex-none"`
opts a button out.

`sidebar-layout` is the optional shell: content surface, page header, collapse control,
title, header actions.

### Toast

`actions` for up to three buttons; `actionProps` remains for one.

## Inspector and registry parity

The inspector is a review site, not the installable catalog. `sidebar-layout` appears
inside the Sidebar demo, and the "Select · Sort" entry demonstrates `SelectSortTrigger`
(install `select`). Demo helpers, sample data, navigation, settings controls, and page
wrappers are not registry components.
