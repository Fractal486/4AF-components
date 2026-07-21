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

## Installable catalog

The catalog currently contains 34 installable UI items. Verify the count and names with
`pnpm 4af list` before making registry-wide claims.

### Actions

| Install name | Main API | Use it for |
| --- | --- | --- |
| `button` | `Button`, `Spinner` | Primary, outline, ghost, plain, destructive, link, and icon controls; loading; `asChild`; optional press scaling. |
| `toggle` | `Toggle` | Base UI pressed/unpressed controls using Button visuals and sizes. |
| `morph` | `Morph` | Animated icon or text replacement that reserves stable space. |
| `action-button` | `ActionButton` | Async actions with idle, pending, success, and error states. |
| `copy-button` | `CopyButton` | Clipboard actions with visual and screen-reader confirmation. |
| `delete-button` | `DeleteButton` | Quiet destructive, two-step confirmation with Escape, blur, and timeout disarming. |

### Fields and selection

| Install name | Main API | Use it for |
| --- | --- | --- |
| `input` | `Input` | Default, plain, and underline fields; number steppers; invalid/disabled states. |
| `textarea` | `Textarea` | Matching multiline fields with an optional custom resize grip. |
| `field-error` | `FieldError` | Standalone inline error feedback with `role="alert"`; not tied to field context. |
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
| `badge` | `Badge` | Outline/status labels with optional icon or dot and animated content changes. |
| `skeleton` | `Skeleton` | Generic loading placeholders; animation respects reduced motion. |
| `empty` | `Empty` and composition parts | Empty states with optional dashed placeholder treatment. |
| `text-shimmer` | `TextShimmer` | Theme-aware looping highlight for working labels. |
| `toast` | `ToastProvider`, `useToast`, `createToastManager` | Managed notifications, swipe dismissal, placement/stack modes, and up to three actions. |

### Navigation and application structure

| Install name | Main API | Use it for |
| --- | --- | --- |
| `tabs` | `Tabs`, `TabsList`, `TabsTab`, `TabsPanel` | Segment, pill, or underline tabs with a traveling indicator. |
| `table-of-contents` | `TableOfContents` | Observed heading navigation with smooth scrolling and active marker. |
| `command-palette` | `CommandPalette` and panel/list/row/action parts | Fuzzy command search, groups, nested/custom panels, configurable headers, keybinds, selection, and actions. |
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
| `hover-card` | `HoverCard`, trigger/content parts | Rich previews opened by hover or keyboard focus. |
| `dropdown-menu` | Menu, checkbox/radio/submenu, shortcut, and nested-select parts | Keyboard menus, safe submenus, destructive items, Kbd hints, and searchable selection panels. |

## Bundled APIs and composition

These are reusable public features, not separate install names.

### FieldError is general-purpose

`field-error` has no field-provider dependency. Use it for field, form, save, or other
short inline errors. When it describes a field, connect it with `aria-describedby` and
mark the field invalid.

### Press scaling can be disabled

`Button` and `Toggle` accept `pressScale={false}`. Use it for anchored triggers when
press resizing would make the attached popup appear to move. `ActionButton`, `CopyButton`,
and `DeleteButton` inherit the Button prop.

### Select Sort belongs to Select

Install `select` to use `SelectSortTrigger`; there is no `select-sort` registry item.
The trigger automatically uses the sort treatment: dashed while empty, filled when
selected or open, selected-label display, and matching chevron state. Enable the separate
clear footer with `clearable` on `SelectContent`.

| Install name | Trigger | Panel entrance | Search location |
| --- | --- | --- | --- |
| `select` | Button/field | Standard scale, blur, fade | Optional inside panel |
| `select-search` | Editable Combobox | Standard positioned panel | Trigger field |
| `select-motion` | Button/field | Unfolding panel | Optional inside panel |
| `select-motion-search` | Editable Combobox | Unfolds from field | Trigger field |

All three support single and multi selection. Multi selection uses Checkbox. Only base
`select` bundles `SelectSortTrigger`.

### Command Palette is a component family

The `command-palette` item includes root groups/rows, nested lists, arbitrary custom
panels through `helpers.openPanel`, search or text-field panel headers, per-panel header
actions, badges, checkboxes, Kbd hints, destructive states, and grouped action panels.

Escape clears a non-empty header field only when that header is `type="search"`.
Traditional text-field headers go back instead. Projects, Rename Project, and New Project
in the inspector are public-API examples rather than private behavior.

### Dropdown Menu has three nested-panel forms

The `dropdown-menu` item includes the original navigation submenu, a single-select panel
with a trailing checkmark, and a checkbox-based multi-select panel. Selection panels can
include search. Safe pointer travel keeps the parent active while moving into its panel.

### Sidebar and layout are separate

`sidebar` provides low-level default, floating, inset, and split forms; reusable
collapsible sections; per-row actions; badges; nested rows; search/button headers; and row
skeletons. Consumers can compose a row action with `dropdown-menu`.

`sidebar-layout` is an optional installable shell. It adds the content surface, page
header, left-side collapse control, title, and optional header actions without forcing
that layout on every Sidebar consumer.

### Toast supports multiple actions

Use `actions` for up to three custom toast buttons. The Base UI-compatible `actionProps`
option remains available for one action.

## Inspector and registry parity

The inspector is a review site, not the installable catalog.

`sidebar-layout` is an installable page-frame companion intentionally represented in the
Sidebar demo rather than by a dedicated inspector entry.

The inspector's “Select · Sort” / `select-sort` entry demonstrates `SelectSortTrigger`;
install `select`.

Demo helpers, sample data, inspector navigation, settings controls, fullscreen wrappers,
and page composition are not registry components.
