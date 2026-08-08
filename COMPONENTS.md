# 4AF Components — Registry Guide

4AF Components is a private React component library with a deliberately restrained,
warm-neutral visual language. It is distributed as source code through a local shadcn
registry: installing a component copies its TypeScript source into the target project,
along with the theme, shared utilities, and component dependencies it needs.

This is the human-readable guide to the whole library. For the exact machine-readable
list, `registry.json` and `pnpm 4af list` are the source of truth.

## What belongs to what

The project has three related surfaces that should not be confused:

| Surface | Meaning |
| --- | --- |
| Registry item | A source bundle that can be installed by name with `pnpm 4af install`. |
| Export or subcomponent | An API included inside a registry item, such as `SelectSortTrigger` inside `select`. |
| Inspector entry | A visual demo in the Web UI. A demo may represent a complete registry item or only one usage of it. |

For example, `select` is an installable registry item. `SelectSortTrigger` is included in
that item. The Web UI calls its demo “Select · Sort,” but there is intentionally no
separate `select-sort` registry item.

## Design and engineering style

### Visual language

- Warm-neutral greys rather than cold slate greys, with low chroma and a subtle warm hue.
- Ink is the normal primary action. Amber is reserved for focus and other deliberate
  signals instead of colouring every primary control.
- Destructive actions use the destructive red token. Quiet destructive actions may use
  red text without a red hover surface.
- Light and dark themes share semantic names such as `background`, `surface`, `muted`,
  `foreground`, `border`, `ring`, `primary`, and `destructive`.
- Geist Sans is the interface typeface and Geist Mono is used for keyboard hints and
  code-like text.
- Radii are concentric: an outer container's radius equals the inner radius plus the
  padding between them.
- Buttons and raised controls normally use the transparent `shadow-border` treatment.
  Real borders are kept for dividers, table cells, and other true separators.
- A component's fill states how high it sits: `background` for the page and for sunk wells
  (input fields, the checkbox and radio field, `SidebarInset`); `surface` for chrome and
  anchored popups (sidebar, dropdown menu, popover, hover card); `surface-raised` for what
  floats over everything (dialog, alert dialog, sheet, command palette, toast). A consuming
  project decides what those resolve to.

### Behaviour and accessibility

- Base UI is the canonical behaviour layer for focus management, keyboard navigation,
  roving focus, dialogs, popups, collision handling, and ARIA wiring.
- Interactive components support controlled and uncontrolled state where that distinction
  applies.
- Props and refs are forwarded, and composable controls support element replacement where
  appropriate.
- State is exposed through attributes such as `data-state`, `data-variant`, and
  `data-loading`, making styling and testing predictable.

### Motion

- Simple hover, focus, and colour changes are CSS-first.
- Motion is used when an element must animate out, follow a gesture, use spring physics,
  or animate layout.
- Transitions name the properties they animate. Layout properties such as width, height,
  top, and left are not animated frame by frame.
- CSS durations come from `--duration-fast`, `--duration-base`, `--duration-slow`, and
  `--duration-slower`.
- Reduced-motion users receive collapsed CSS durations and zero-duration JavaScript
  transitions. Essential looping progress indicators retain their deliberate duration;
  decorative loops such as Text Shimmer stop rather than becoming a strobe.

## Repository layout

```text
registry/     Portable library source. Never imports from app/ or inspector/.
  lib/        Shared cn, slot, and motion helpers.
  ui/         Installable component source.
inspector/    Web UI demos and controls. Imports from registry/.
app/          Minimal Next.js shell for the inspector.
_incoming/    Temporary staging for downloaded source; never imported.
registry.json Installable item metadata and dependency graph.
scripts/4af.ts
              The deterministic list, doctor, and install workflow.
```

The dependency direction is always `app` → `inspector` → `registry`.

## CLI

Run the CLI from the 4AF Components repository. Use an absolute path for the target
project so there is no ambiguity about where files will be written.

The repository toolchain is pinned to Node 24.18.1 LTS and pnpm 11.18.0 (`.node-version` and
`package.json`). The registry commands use shadcn 4.13.1, so validation, build, and install
behave consistently across machines.

### Target project requirements

The target project must already have:

- a `package.json`;
- a shadcn `components.json`;
- `ui` and `lib` aliases in `components.json`.

The target may use its own alias paths. Examples below assume the common
`@/components/ui` and `@/lib` mapping.

### List components

```powershell
pnpm 4af list
```

This reads `registry.json` and lists every `registry:ui` item. Shared foundation items are
not shown because they are pulled in automatically as dependencies.

### Check a target project

```powershell
pnpm 4af doctor --project C:\Projects\my-app
```

`doctor` checks the package, shadcn configuration, and required aliases without changing
the project.

### Preview an installation

```powershell
pnpm 4af install select --project C:\Projects\my-app --dry-run
```

The dry run lists every target file, theme CSS merge, package dependency addition, existing
dependency, and target-file conflict. It does not write to the target project.

### Install a component

```powershell
pnpm 4af install select --project C:\Projects\my-app
```

The command builds the private registry, starts a temporary local registry server, invokes
shadcn non-interactively, and stops the server afterward. The target does not need the 4AF
development server to be running.

Dependencies are recursive. Installing `command-palette`, for example, also brings in its
Select, Checkbox, shared helpers, package dependencies, and the 4AF theme.

Existing files are never replaced silently. Use `--overwrite` only when replacement is
intentional:

```powershell
pnpm 4af install select --project C:\Projects\my-app --overwrite
```

From another working directory, point pnpm at this repository:

```powershell
pnpm --dir C:\Files\Development\4AF-components 4af install button --project C:\Projects\my-app
```

After installation, import the copied source from the target project's `ui` alias:

```tsx
import { Button } from "@/components/ui/button";
```

## Shared foundation

These registry entries support the UI components. They are normally installed
transitively rather than requested directly through `pnpm 4af install`.

| Registry item | Purpose |
| --- | --- |
| `4af-theme` | Semantic colours, typography, radii, shadows, keyframes, and motion-duration tokens for light and dark themes. |
| `cn` | Class-name composition using `clsx` and `tailwind-merge`. |
| `slot` | The small local slot helper used for `asChild` composition. |
| `motion` | Shared spring and easing presets for Motion-driven components. |
| `use-action` | The run/pending/outcome/revert state machine behind Action Button and the menu's action row. |

## Full installable UI registry

The following 42 names are accepted by `pnpm 4af install <name>`.

### Actions

| Install name | Main API | What it provides |
| --- | --- | --- |
| `button` | `Button` | Primary, outline, ghost, plain, destructive, and link variants; text and icon sizes; optical icon spacing; loading without resizing (the ASCII loader, as everywhere else); `asChild`; optional `pressScale={false}` for anchored controls and `pressTarget="content"` for joined ones. |
| `button-group` | `ButtonGroup` | Joins two or more Buttons into one control: flattened inner corners, one hairline per seam, a single outline around the run, horizontal or vertical, with `variant`/`size` passed down as defaults. |
| `toggle` | `Toggle` | A Base UI pressed/unpressed control using the Button appearance and sizes, with optional icon-fill behaviour and `pressScale={false}` support. |
| `morph` | `Morph` | Animated icon or text replacement that reserves the wider state's space and handles reduced motion. |
| `action-button` | `ActionButton` | Runs asynchronous work and presents idle, pending, success, and error states without changing width, then reverts. |
| `action-toggle` | `ActionToggle` | A toggle whose state has to be earned: it waits on the action, lands when it succeeds, and stays put when it fails. Follow/Following, Subscribe/Subscribed. |
| `copy-button` | `CopyButton` | Clipboard-specialized Action Button with visual and screen-reader confirmation. |
| `delete-button` | `DeleteButton` | Quiet destructive button that arms on the first deliberate press and confirms on the second; Escape, blur, and timeout disarm it. |

### Fields and selection

| Install name | Main API | What it provides |
| --- | --- | --- |
| `input` | `Input` | Base UI input with default, plain, and underline structures; neutral or accent focus; invalid and disabled states; custom number steppers. |
| `textarea` | `Textarea` | Multiline field matching Input, with an optional pointer-captured corner resize grip. |
| `switch` | `Switch` | Base UI switch with a sliding, press-squishing thumb and adaptive or fixed tone. |
| `checkbox` | `Checkbox` | Base UI checkbox with an animated drawn tick, controlled/uncontrolled state, and an optional click-target label. |
| `radio` | `RadioGroup`, `Radio` | Single-choice Base UI radio group with the Checkbox family's geometry and an animated dot. |
| `slider` | `Slider` | Controlled or uncontrolled numeric slider with a spring-gliding fill and three thumb variants: `bar` (thin handle), `circle` (round thumb filling the rail), and `knob` (round thumb over a thin rail). |
| `select` | `Select`, `SelectTrigger`, `SelectSortTrigger`, `SelectValue`, `SelectContent`, `SelectItem` | Accessible Base UI single/multi select with icons (declarable on `items` so a preselected value resolves before mount), optional in-panel search, clear footer, content sizing, and the compact sort/filter trigger. |
| `select-search` | `SearchSelect`, `SearchSelectInput`, `SearchSelectContent`, item parts | Editable Combobox-style trigger with live filtering, single or checkbox-based multi-selection, icons, and full keyboard/ARIA behaviour. |
| `select-motion` | `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` | Hand-animated unfolding Select with single/multi selection and optional in-panel search. |
| `select-motion-search` | `MotionSearchSelect`, input/content/item parts | Editable Base UI Combobox whose panel unfolds from the field; supports single and checkbox-based multi-selection. |

### Feedback and status

| Install name | Main API | What it provides |
| --- | --- | --- |
| `progress` | `Progress`, `ProgressLabel`, `ProgressValue` | Determinate Base UI progress bar whose fill moves with transform rather than animated width. |
| `alert` | `Alert` | Inline status line — glyph plus sentence, no surface — in five variants: destructive `error` (hexagon, `role="alert"`), amber `warning` (triangle), green `success` (check), neutral `info`, and muted `loading` (ASCII spinner); the last four are `role="status"`. Renders nothing for an empty message and is tied to no field context. |
| `badge` | `Badge` | Status badge with outline/status treatments, optional icon or dot, and animated label/glyph changes. |
| `skeleton` | `Skeleton` | Generic loading placeholder sized by normal utility classes; its pulse is disabled for reduced motion. |
| `empty` | `Empty` and its header, media, title, description, and content parts | Composable empty state, borderless by default with an optional dashed placeholder treatment. |
| `text-shimmer` | `TextShimmer` | Theme-aware looping highlight across text for “working” labels; supports another element through `as` and a custom duration. |
| `toast` | `ToastProvider`, `useToast`, `createToastManager` | Base UI toast manager with list or collapsed-stack presentation, bottom-centre/right placement, timers, focus handling, swipe dismissal, and up to three custom action buttons per toast. |

Use `actions` for up to three custom buttons. The existing Base UI-compatible `actionProps`
option remains available for a single action.

### Navigation and application structure

| Install name | Main API | What it provides |
| --- | --- | --- |
| `tabs` | `Tabs`, `TabsList`, `TabsTab`, `TabsPanel` | Base UI tabs with a travelling Motion indicator; segment, pill, and underline appearances, with optional solid treatment. |
| `collapsible` | `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` | Base UI disclosure row in `plain` or `card` appearance, with a rotating chevron at either end (or none). The panel slides its height so rows underneath travel rather than jump — the library's one deliberate exception to compositor-only motion, since no transform can move the following rows — while the content itself dissolves in out of a blur. |
| `table-of-contents` | `TableOfContents` | Heading navigation that observes visible headings, keeps the last passed section active through long prose, smooth-scrolls, and uses a `span` or `single` active marker. |
| `table-of-contents-lines` | `TableOfContentsLines` | Line-based heading navigation with a longer header rule, two shorter content rules, level indentation, and a smooth expanding hover treatment. |
| `separator` | `Separator` | Accessible horizontal or vertical divider built on Base UI Separator. |
| `command-palette` | `CommandPalette`, custom panel/list/row/action parts, `useCommandSearch`, and `useCommandPanelHighlight` | Keyboard-first command/search dialog with fuzzy ranking, groups, nested and custom panels, async/server-driven and paginated search, header text fields, per-panel header actions, badges, checkboxes, keybinds, destructive actions, and keyboard navigation. |
| `sidebar` | `SidebarProvider`, `Sidebar`, `SidebarPanel`, `SidebarHeaderButton`, menu/group/submenu/action/badge/skeleton parts | Responsive application sidebar with sidebar, floating, inset, split, split-floating, and split-inset layouts; controlled collapse; sections; nested rows; a canonical full-width primary header action; badges; and loading skeletons. |
| `sidebar-layout` | `SidebarLayout` | Optional reusable viewport shell that composes Sidebar with a contained, independently scrolling inset surface, left-aligned collapse control, page title, and header actions. |

### Overlays and menus

| Install name | Main API | What it provides |
| --- | --- | --- |
| `tooltip` | `TooltipProvider`, `Tooltip` | Base UI hover/focus tooltip with delay, collision-aware placement, and a CSS scale-and-blur entrance. |
| `sheet` | `Sheet` and trigger, close, content, header, body, footer, title, and description parts | Focus-trapped Base UI dialog that enters from an edge. |
| `dialog` | `Dialog` and content/title/footer parts; `DialogSteps`, `DialogStep` | Centred modal with enter/exit motion and optional validated multi-step flow. |
| `alert-dialog` | `AlertDialog` and content, action, cancel, title, and description parts | Decision-forcing modal that cannot be dismissed by clicking away. |
| `popover` | `Popover` and trigger, close, content, header, title, and description parts | Interactive anchored panel with Base UI positioning and optional modal behaviour. |
| `selection-toolbar` | `SelectionToolbar`; `SelectionToolbarButton`, `SelectionToolbarActionButton`, `SelectionToolbarToggle`, `SelectionToolbarActionToggle`, `SelectionToolbarToggleGroup`, `SelectionToolbarSeparator`; `useSelectionToolbar` | A bar of ghost-button actions over selected text, in the tooltip's material. Base UI Popover anchored to the range itself — so it follows the text as the page scrolls — composed with Base UI Toolbar for roving-tabindex items. Item kinds match the menu's rows: plain, async with pending/success/error in place, toggle, deferred toggle, and an exclusive group. It swallows `mousedown` so the press can't collapse the selection, and hands the captured text and range to every action. |
| `hover-card` | `HoverCard`, `HoverCardTrigger`, `HoverCardContent`, `HoverCardSkeleton` | Rich preview panel shown from hover or keyboard focus, with a built-in loading placeholder and custom loading content support. |
| `dropdown-menu` | Root/trigger/content/item, checkbox/radio/submenu parts, shortcut and nested-select parts | Base UI menu with keyboard navigation, safe submenu pointer travel, Kbd-style shortcuts, destructive rows, original submenus, and searchable single/multi select subpanels. |

## Important bundled APIs and patterns

These are real reusable features, but they are not separate registry install names.

### Alert is the general inline status line

`alert` carries no surface of its own — no panel, no border, no padding beyond the space
above it — and has no field context. That is what lets the same line report a failed save,
a passing check, or work in progress anywhere a short status belongs.

```tsx
import { Alert } from "@/components/ui/alert";

<Alert>Could not save your changes.</Alert>
<Alert variant="warning">Sending will notify all 240 members.</Alert>
<Alert variant="success">Changes saved.</Alert>
<Alert variant="info">We'll only use this to send receipts.</Alert>
<Alert variant="loading">Checking availability…</Alert>
```

| Variant | Ink | Glyph | Announced as |
| --- | --- | --- | --- |
| `error` (default) | Destructive red | Hexagon alert | `role="alert"` |
| `warning` | Amber accent | Lucide triangle | `role="status"` |
| `success` | Success green | Lucide check | `role="status"` |
| `info` | Foreground ink | Lucide info | `role="status"` |
| `loading` | Muted grey | ASCII spinner | `role="status"` |

The inks are Badge's status colours value for value, so a line under a field and a badge
beside it read as one severity. The two neutrals differ by weight, not hue: `info` is
full-strength ink because it is a note meant to be read, `loading` is muted because work
in progress is not yet an outcome.

Only the error interrupts. `role="alert"` is right for something that has just stopped the
user; a caution, a confirmation, a note, or a progress line is `role="status"` and waits
for a pause, rather than cutting across whatever the user was being told. The loading
spinner stays out of the accessibility tree entirely — the line beside it is the
announcement, so a live region of its own would say "Loading" over the sentence explaining
what is loading.

The glyph always occupies the same 14px slot, so a line that moves through the states —
checking, then saved or failed — swaps its glyph without the text shifting sideways.
Installing `alert` brings `ascii-loader` with it.

Reach for `badge` when the status is a label on a row rather than a sentence, and for
`toast` when it should arrive over the page rather than live in it.

When it describes a specific field, connect it to that field for assistive technology:

```tsx
<Input
  aria-invalid={Boolean(error)}
  aria-describedby={error ? "email-error" : undefined}
/>
<Alert id="email-error">{error}</Alert>
```

This component was called `FieldError` and installed as `field-error`. `Alert` is exported
alongside a deprecated `FieldError` alias, so existing call sites keep working; the install
name has changed outright.

### Disable press scaling when needed

Buttons scale to `0.95` while pressed by default. Set `pressScale={false}` when the
control is an anchored trigger and its visual resize would make the attached panel feel
like it moves. The default remains enabled for ordinary buttons.

```tsx
<Button pressScale={false}>Open menu</Button>
<Toggle pressScale={false} aria-label="Filter" />
```

Use `pressTarget="content"` instead when the button's edges are joined to something
else's, so the press scales only the label and icons and the box holds still. Shrinking
a joined box opens a gap along every seam. `ButtonGroup` sets this on its children
already; set it by hand only when joining buttons some other way.

```tsx
<Button pressTarget="content">Save</Button>
```

`ActionButton`, `CopyButton`, and `DeleteButton` inherit the same Button prop.

### Waiting looks the same everywhere

Every waiting state in the library is the ASCII loader: `Button`'s `loading`,
`ActionButton` and `ActionToggle` while pending, the menu's action row, the command
palette, and Alert's `loading` variant. `Button` still exports the SVG `Spinner` it used
to draw, but it is deprecated and nothing renders it.

The glyph and the label morph in **separate boxes**, in `ActionButton`, `ActionToggle` and
the menu's action row alike. The loader is a text glyph and about half the advance width of
an icon, so morphing the two together centres the narrower state and drags the label
sideways on every status change.

That split has a consequence worth knowing at the call site: a label with no per-state
override doesn't animate at all. Pass `labels={{ pending: "Saving" }}` when the word should
change, and leave it out when only the glyph should move — a word that never changed should
not be scaled and blurred through a swap it had no part in.

`ActionToggle` follows the same rule for its glyph: with `fillIcon` and no `icons.pressed`
it doesn't swap the glyph on press, because there's nothing to morph *to* and a `fill`
transition plus a morph on one element fight over it.

### A toggle whose state has to be earned

`ActionButton` always reverts — its model is idle → outcome → idle, and there is no opt-out
(`revertAfter={Infinity}` clamps to a 32-bit int and fires almost immediately). When the
new state should *stick*, use `action-toggle`:

```tsx
<ActionToggle
  action={(following) => (following ? follow(id) : unfollow(id))}
  icon={<Plus />}
  icons={{ pressed: <Check /> }}
  labels={{ pressed: "Following" }}
>
  Follow
</ActionToggle>
```

It is a separate component rather than a flag on `ActionButton` for the reason `Toggle`
is separate from `Button`: a button *does* something, this *is* something afterwards, and
the difference is `aria-pressed`.

It is deliberately not optimistic. The label holds and the loader runs until the action
settles, because a control that already reads "Following" while a spinner insists it is
still working is saying two things at once. A failure needs no rollback, since nothing
moved: it shows the error briefly and goes quiet. `onPressedChange` fires only on success,
so a controlled parent is never told about a change that did not happen.

### Copy Button resolves its text on press

`CopyButton`'s `value` takes a function as well as a string:

```tsx
value: string | (() => string | Promise<string>)
```

Reach for the function form whenever the text isn't already sitting in a variable — it has
to be assembled from a selection, read off the DOM, or fetched. Computing it eagerly to
satisfy a `string` means doing that work on every render for a button that may never be
pressed, and if the work is a request, it means requesting on every state change.

```tsx
<CopyButton value={() => selected.map((row) => row.url).join("\n")} />
<CopyButton value={async () => (await fetchDocument(id)).body} />
```

The pending state resolves this correctly in both directions without configuration: a
plain string (or a synchronous function) finishes inside `pendingDelay` and goes straight
to the check mark, while a value that genuinely waits crosses the threshold and shows the
spinner. A function that throws or rejects lands on the error state and never writes to the
clipboard, so `onCopy` reports only text that actually got there.

`icon` overrides the resting glyph, for when what's being copied has its own symbol and two
copy buttons beside each other would otherwise look identical. The success check mark is
unaffected.

```tsx
<CopyButton icon={<Link />} value={() => rows.map((r) => r.url).join("\n")} />
```

### Disable Badge layout animation in reordering lists

`Badge` animates its pill resizing when its content changes. Set `animateLayout={false}`
for a static badge inside a list that filters or reorders (a command-palette row, a table
row), or it FLIP-animates its own position as the row moves — sliding within a row that
does not animate, and adding layout cost. A badge whose content actually changes keeps the
default.

```tsx
<Badge animateLayout={false}>Beta</Badge>
```

### Select Sort is part of Select

Install `select`, then use `SelectSortTrigger`. It automatically:

- uses a dashed border while no value is selected;
- becomes filled and solid when a value is selected;
- remains filled while its panel is open;
- reads and displays the selected label or labels from Select context;
- rotates the chevron with the same treatment as the normal Select trigger.

The clear footer is independently optional. Add `clearable` to `SelectContent` when the
panel should offer it.

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSortTrigger,
} from "@/components/ui/select";

<Select<string>>
  <SelectSortTrigger label="Status" />
  <SelectContent width="content" clearable autoFocusFirstItem={false}>
    <SelectItem value="active">Active</SelectItem>
    <SelectItem value="paused">Paused</SelectItem>
  </SelectContent>
</Select>
```

This is why the Web UI has a “Select · Sort” demo while the registry has no
`select-sort` item.

### The three installable Select implementations

| Install name | Trigger model | Panel motion | Search |
| --- | --- | --- | --- |
| `select` | Button/field trigger | Scale, blur, and fade | Optional search inside the panel |
| `select-search` | Editable Combobox input | Standard positioned panel entrance | The trigger itself is the search field |
| `select-motion` | Button/field trigger | Hand-animated unfolding panel | Optional search inside the panel |
| `select-motion-search` | Editable Combobox input | Unfolds from the field | The trigger itself is the search field |

Single and multi-selection are supported across the family. Multi-selection uses the
Checkbox component. `SelectSortTrigger` belongs only to the base `select` item.

In `select`, an option's icon can be declared on the `items` collection alongside its
label:

```tsx
<Select
  items={[{ value: "sans", label: "Sans-serif", icon: <Type /> }]}
  defaultValue="sans"
>
```

Do that whenever a preselected value must show its icon. `SelectItem`'s own `icon` prop
only registers when the popup mounts, so on a cold load the closed trigger has nothing to
show until the panel has been opened once — `items` is the mapping that exists before
then, which is why the label reads from it too. Use `iconForValue` instead when the icon
is computed rather than declared. Resolution order is the mounted item, then
`iconForValue`, then `items`.

`select-search` and `select-motion-search` need the same thing for the same reason, but
get it a different way. They're Combobox-based, so an item *is* its value
(`<SearchSelectItem value={item}>`) — there's no key to look up in a separate mapping.
Put the icon on the item data and the closed field resolves it on first paint:

```tsx
const fruits = [{ value: "apple", label: "Apple", icon: <Apple /> }];

<SearchSelect items={fruits} defaultValue={fruits[0]}>
```

No type change is needed — Base UI types Combobox `items` as `readonly any[]` — and the
convention extends the `{ value, label }` shape Base UI already treats specially. An icon
passed only to `<SearchSelectItem icon={…}>` still can't resolve before mount, because
nothing outside the popup has seen it. Resolution order in both is the mounted item, then
`iconForValue`, then the value's own `icon`.

Every implementation takes `size="sm" | "md"` (default `sm`). `sm` is the compact 32px
size (12px text, 14px glyphs); `md` is 36px and matches Button `md` and the Input for form
rows. The size scales the trigger and the option rows together. Inside a Command Palette
panel, always use `sm` (the default) — it fits the palette's density.

### Command Palette composition

It opens and closes with no enter or exit animation, on either the backdrop or the panel.
That is deliberate: a palette is summoned mid-thought and typing usually begins before it
has finished arriving, so an entrance is time spent between deciding and typing. With
nothing to play out, the portal mounts and unmounts under Base UI directly — no
`keepMounted`, no `AnimatePresence` — and the item carries no Motion dependency.

The registry item includes more than the root popup:

- root groups and rows with icons, descriptions, badges, keybinds, and destructive state;
- nested item lists;
- arbitrary custom panels opened through `helpers.openPanel`;
- custom panel header search fields or traditional text fields;
- Escape-to-clear for `type="search"` header fields, while traditional text fields use Escape to go back;
- per-panel `headerActions`, suitable for Select and Select Sort controls (use `size="sm"`, the default, so they fit the palette);
- custom list rows with trailing badges or selection checkboxes;
- grouped action panels with section labels, icons, keybinds, search, and destructive actions;
- async/server-driven search: pass `onSearch` on the root (with `groups` as the resting state), or call the exported `useCommandSearch` hook in a custom panel and render `CommandPanelLoading` for its first-load state. Root failures render `searchErrorMessage`; custom panels receive the failure as the hook's `error`;
- paginated custom panels: observe the shared keyboard/pointer highlight with `useCommandPanelHighlight`, fetch when the last row is reached, and pass that request as `additionalRefreshing` to `useCommandSearch` so the panel header keeps showing its inline loader.

The demo's Projects, Rename Project, and New Project flows are examples built from these
public APIs, not hard-coded private behaviour.

An actions row normally chooses and closes the menu. Three optional fields make it report
in place instead, keeping the menu open — the same shapes the dropdown menu offers,
expressed as data because a palette action *is* data:

| Shape | Fields | Dropdown equivalent |
| --- | --- | --- |
| Runs, confirms, reverts | `action` | `DropdownMenuActionItem` |
| Runs, then lands checked | `action` + `checked`/`defaultChecked` | `DropdownMenuCheckboxItem` with `action` |
| Flips at once, morphing | `checked`/`defaultChecked` | `DropdownMenuCheckboxItem` + `Morph` |
| Asks, then commits and closes | `confirm` + `onSelect` | `DeleteButton` |

```tsx
<CommandPanelActions
  items={[
    { id: "sync", label: "Sync now", action: sync, labels: { pending: "Syncing…", success: "Synced" } },
    { id: "watch", label: "Watch", defaultChecked: false, action: watch, labels: { checked: "Watching" } },
    { id: "star", label: "Star", defaultChecked: false, labels: { checked: "Starred" } },
  ]}
/>
```

`labels` and `icons` carry the other states (`checked`, `pending`, `success`, `error`),
each falling back to the row's own `label`/`icon`; pending and error default to the ASCII
loader and the warning triangle. `revertAfter` and `pendingDelay` behave as on
`ActionButton`. Neither toggle shows a success tick — the row having become the other
thing is the confirmation. An item with none of these fields is unchanged: it closes the
menu and calls `onSelect`.

`confirm` is the exception that closes: the first press arms and morphs the row (to
`confirm.label`, "Confirm?" by default), the second runs `onSelect` and dismisses the menu
by the ordinary path. It disarms on Escape, when the menu closes, and after
`confirm.resetAfter` (3s; `0` never). A press within 350ms of arming is ignored, so one
double-click can't confirm what it just armed — the same rules as `DeleteButton`, which is
the standalone version of this row.

### Dropdown Menu nested panels

`dropdown-menu` includes three reusable nested-panel forms:

- the original navigation submenu;
- a single-select panel with the chosen value shown in the parent row and a checkmark in
  the panel;
- a multi-select panel using small Checkbox components and an `N selected` parent label.

Single- and multi-select panels can include in-panel search. Their parent highlight stays
active while the pointer is on the parent, inside the nested panel, or moving through the
safe pointer corridor.

A checkbox item can also read as a toggle button rather than a ticked row. Its `children`
may be a function of the checked state, and `indicator={false}` drops the left tick and
its indent, so the state is carried by the icon and label instead:

```tsx
<DropdownMenuCheckboxItem indicator={false}>
  {(checked) => (
    <>
      <Morph activeKey={checked ? "on" : "off"} items={{ on: <BellOff />, off: <Bell /> }} />
      <Morph activeKey={checked ? "on" : "off"} items={{ on: "Unmute", off: "Mute" }} />
    </>
  )}
</DropdownMenuCheckboxItem>
```

Use `fillIcon` instead when the glyph doesn't change shape — a bookmark, star, or heart
only changes weight, so there is nothing to morph *to* and it becomes a `fill` transition
on the one element. Either way the row keeps its `menuitemcheckbox` semantics.

Rows left-align any `Morph` inside them, and mute a morphing leading icon to the same
weight as a plain one. Don't pass `place-items-start` or a text colour at the call site.

`DropdownMenuActionItem` is the row that runs something, shows how it went, and puts
itself back — the menu's Action Button:

```tsx
<DropdownMenuActionItem
  icon={<Link2 />}
  action={() => navigator.clipboard.writeText(url)}
  labels={{ success: "Copied" }}
  announce={{ success: "Link copied" }}
>
  Copy link
</DropdownMenuActionItem>
```

It defaults to `closeOnClick={false}`, because a row closes the menu on click and an
outcome shown on a row the user can no longer see is no outcome at all. Override it for an
action whose result is visible on the page behind the menu. It takes the same `labels`,
`icons`, `revertAfter`, `pendingDelay`, `announce`, `onSuccess`, and `onError` as
`ActionButton`, and both morph between states without the row resizing.

When the row should *land* in a new state rather than revert, give
`DropdownMenuCheckboxItem` an `action` instead — the menu's `ActionToggle`:

```tsx
<DropdownMenuCheckboxItem action={(muted) => setMuted(id, muted)}>
  Mute thread
</DropdownMenuCheckboxItem>
```

Without `action` the row is the plain synchronous checkbox it has always been. With it,
the tick holds and the loader runs in its slot until the work settles; `onCheckedChange`
fires only on success, and a failure needs no rollback because nothing moved. With
`indicator={false}` there is no tick slot to put the loader in, so the children function
receives the status as a second argument for you to render it yourself.

Both deferred rows keep their status announcement *outside* the row element. A menu item's
accessible name is built from its contents, so an `sr-only` live region inside would rename
the row to "Mute thread Working" for as long as it ran.

### Selection Toolbar item kinds

The bar's items mirror the menu's rows, minus the nested panels, and each is the library
component that already owns that behaviour rather than a toolbar-local reimplementation.

| Item | Built on | Dismisses the bar |
| --- | --- | --- |
| `SelectionToolbarButton` | `Button` | Yes. `keepOpen` opts out. |
| `SelectionToolbarActionButton` | `ActionButton` | No. `closeOnSuccess` opts in. |
| `SelectionToolbarToggle` | `Toggle` | Never |
| `SelectionToolbarActionToggle` | `ActionToggle` | Never |
| `SelectionToolbarToggleGroup` | Base UI `ToggleGroup` in `Toolbar.Group` | — |
| `SelectionToolbarSeparator` | Base UI `Toolbar.Separator` | — |

The dismissal rules differ on purpose. An async action draws its outcome *in the bar*, so
dismissing on press would put a check on a surface that has already gone — the same reason
`DropdownMenuActionItem` defaults to `closeOnClick={false}`. A toggle *is* something rather
than does something: you press it to see the state change, and usually press its neighbour
next. Only the plain button completes and leaves.

Every action is handed the selection as it was when the bar opened — `onAction(text, range)`,
`action(text, range)`, `onAction(pressed, text, range)` — because by the time a click handler
runs the live selection may belong to something else. Don't call `window.getSelection()` from
an action.

`variant="destructive"` is quieted to red ink on the neutral hover rather than the solid red
fill, the same call the menu makes for its destructive row: a 24px slab of red inside a 32px
bar is louder than the bar it sits in.

For a bar item whose state depends on the selection — a toggle that should read as pressed
when the text is already highlighted — write a small component and call `useSelectionToolbar()`
inside it. The element is created outside the bar but renders inside it, so the hook reads the
right selection:

```tsx
function HighlightToggle() {
  const { range } = useSelectionToolbar();
  return <SelectionToolbarToggle pressed={isHighlighted(range)} … />;
}
```

### Sidebar composition and layout

`sidebar` is the low-level component family. It includes default, floating, inset, and
split forms; collapsible sections; per-row actions; badges; nested rows; header search or
button controls; and row skeletons. A header holds one full-width `SidebarHeaderButton`,
or two side by side when they are wrapped in `SidebarHeaderRow`:

```tsx
<SidebarHeader>
  <span>Emails</span>
  <SidebarHeaderRow>
    <SidebarHeaderButton><Plus />Compose</SidebarHeaderButton>
    <SidebarHeaderButton variant="outline"><Search />Search</SidebarHeaderButton>
  </SidebarHeaderRow>
</SidebarHeader>
```

The row owns the spacing below the title, splits its width evenly between the buttons, and
stacks them once the sidebar collapses to icons. A button that should keep its own width
opts out with `className="flex-none"`. Menus such as the three-dot action menu are composed
with `dropdown-menu` by the consumer.

`sidebar-layout` is intentionally separate but installable. It is the reusable application
frame around Sidebar, not behaviour that every Sidebar user must accept. It constrains the
shell to the viewport, keeps the sidebar and header fixed, gives the inset content region
ownership of vertical scrolling, and supplies the header title, left-side collapse control,
and optional right-side header actions. A boxed preview can override the provider height
through `className`, as the inspector does with `h-full`.

## Inspector and registry parity

The inspector is a visual review site, not the registry itself.

### Registry items and inspector entries

Every installable UI item except `sidebar-layout` has a dedicated inspector entry.
`sidebar-layout` is intentionally represented within the Sidebar demo because it is a
page-frame companion, not a standalone primitive. Shared foundation items such as the theme,
`cn`, `slot`, and motion presets are installed as dependencies and intentionally do not appear
as standalone demos.

### Inspector entry without a separate registry item

| Inspector entry | What to install |
| --- | --- |
| `select-sort` / “Select · Sort” | Install `select`; the API is `SelectSortTrigger`. |

### Demo-only helpers

The inspector also contains example helpers for Action Button, Badge cycling, Command
Palette, Morph, Select fruit icons, Sidebar, and Table of Contents. They hold demo state,
sample data, or page composition and are intentionally not installable components. The
inspector's own sidebar, toolbar, settings controls, fullscreen view, and page wrappers are
also site infrastructure rather than library content.

## Working on this repository

```powershell
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm registry:validate
pnpm registry:build
```

Never run `pnpm build` while `pnpm dev` is running. They share `.next`, and the production
build can remove CSS chunks that the development server is still trying to serve.

When a component is added or renamed, update `registry.json`, its inspector entry when it
has one, and this guide. Use `pnpm 4af list` to confirm the installable catalog rather than
maintaining a second hard-coded CLI list.

