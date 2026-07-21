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
  transitions. Looping indicators are stopped rather than accelerated into a strobe.

## Repository layout

```text
registry/     Portable library source. Never imports from app/ or inspector/.
  lib/        Shared cn, slot, and motion helpers.
  ui/         Installable component source.
inspector/    Web UI demos and controls. Imports from registry/.
app/          Minimal Next.js shell for the inspector.
_incoming/    Temporary staging for downloaded source; never imported.
registry.json Installable item metadata and dependency graph.
scripts/4af.mjs
              The deterministic list, doctor, and install workflow.
```

The dependency direction is always `app` → `inspector` → `registry`.

## CLI

Run the CLI from the 4AF Components repository. Use an absolute path for the target
project so there is no ambiguity about where files will be written.

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

The dry run reports which files would be installed and whether any target files already
exist.

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

## Full installable UI registry

The following 35 names are accepted by `pnpm 4af install <name>`.

### Actions

| Install name | Main API | What it provides |
| --- | --- | --- |
| `button` | `Button`, `Spinner` | Primary, outline, ghost, plain, destructive, and link variants; text and icon sizes; optical icon spacing; loading without resizing; `asChild`; optional `pressScale={false}` for anchored controls. |
| `toggle` | `Toggle` | A Base UI pressed/unpressed control using the Button appearance and sizes, with optional icon-fill behaviour and `pressScale={false}` support. |
| `morph` | `Morph` | Animated icon or text replacement that reserves the wider state's space and handles reduced motion. |
| `action-button` | `ActionButton` | Runs asynchronous work and presents idle, pending, success, and error states without changing width. |
| `copy-button` | `CopyButton` | Clipboard-specialized Action Button with visual and screen-reader confirmation. |
| `delete-button` | `DeleteButton` | Quiet destructive button that arms on the first deliberate press and confirms on the second; Escape, blur, and timeout disarm it. |

### Fields and selection

| Install name | Main API | What it provides |
| --- | --- | --- |
| `input` | `Input` | Base UI input with default, plain, and underline structures; neutral or accent focus; invalid and disabled states; custom number steppers. |
| `textarea` | `Textarea` | Multiline field matching Input, with an optional pointer-captured corner resize grip. |
| `field-error` | `FieldError` | Standalone destructive error line with a hexagon icon and `role="alert"`. It renders nothing for an empty message and is not tied to a field context. |
| `switch` | `Switch` | Base UI switch with a sliding, press-squishing thumb and adaptive or fixed tone. |
| `checkbox` | `Checkbox` | Base UI checkbox with an animated drawn tick, controlled/uncontrolled state, and an optional click-target label. |
| `radio` | `RadioGroup`, `Radio` | Single-choice Base UI radio group with the Checkbox family's geometry and an animated dot. |
| `slider` | `Slider` | Controlled or uncontrolled numeric slider with a spring-gliding fill and three thumb variants: `bar` (thin handle), `circle` (round thumb filling the rail), and `knob` (round thumb over a thin rail). |
| `select` | `Select`, `SelectTrigger`, `SelectSortTrigger`, `SelectValue`, `SelectContent`, `SelectItem` | Accessible Base UI single/multi select with icons, optional in-panel search, clear footer, content sizing, and the compact sort/filter trigger. |
| `select-search` | `SearchSelect`, `SearchSelectInput`, `SearchSelectContent`, item parts | Editable Combobox-style trigger with live filtering, single or checkbox-based multi-selection, icons, and full keyboard/ARIA behaviour. |
| `select-motion` | `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` | Hand-animated unfolding Select with single/multi selection and optional in-panel search. Use when the unfolding entrance is the reason for choosing it. |
| `select-motion-search` | `MotionSearchSelect`, input/content/item parts | Editable Base UI Combobox whose panel unfolds from the field; supports single and checkbox-based multi-selection. |

### Feedback and status

| Install name | Main API | What it provides |
| --- | --- | --- |
| `progress` | `Progress`, `ProgressLabel`, `ProgressValue` | Determinate Base UI progress bar whose fill moves with transform rather than animated width. |
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
| `table-of-contents` | `TableOfContents` | Heading navigation that observes the current section, smooth-scrolls, and slides a marker to the active item. |
| `command-palette` | `CommandPalette` and custom panel/list/row/action parts | Keyboard-first command/search dialog with fuzzy ranking, groups, nested and custom panels, header text fields, per-panel header actions, badges, checkboxes, keybinds, destructive actions, and keyboard navigation. |
| `sidebar` | `SidebarProvider`, `Sidebar`, `SidebarPanel`, menu/group/submenu/action/badge/skeleton parts | Responsive application sidebar with sidebar, floating, inset, split, split-floating, and split-inset layouts; controlled collapse; sections; nested rows; actions; badges; and loading skeletons. |
| `sidebar-layout` | `SidebarLayout` | Optional reusable page shell that composes Sidebar with its inset content surface, left-aligned collapse control, page title, and header actions. |

### Overlays and menus

| Install name | Main API | What it provides |
| --- | --- | --- |
| `tooltip` | `TooltipProvider`, `Tooltip` | Base UI hover/focus tooltip with delay, collision-aware placement, and a CSS scale-and-blur entrance. |
| `sheet` | `Sheet` and trigger, close, content, header, body, footer, title, and description parts | Focus-trapped Base UI dialog that enters from an edge. |
| `dialog` | `Dialog` and content/title/footer parts; `DialogSteps`, `DialogStep` | Centred modal with enter/exit motion and optional validated multi-step flow. |
| `alert-dialog` | `AlertDialog` and content, action, cancel, title, and description parts | Decision-forcing modal that cannot be dismissed by clicking away. |
| `popover` | `Popover` and trigger, close, content, header, title, and description parts | Interactive anchored panel with Base UI positioning and optional modal behaviour. |
| `hover-card` | `HoverCard`, `HoverCardTrigger`, `HoverCardContent` | Rich preview panel shown from hover or keyboard focus. |
| `dropdown-menu` | Root/trigger/content/item, checkbox/radio/submenu parts, shortcut and nested-select parts | Base UI menu with keyboard navigation, safe submenu pointer travel, Kbd-style shortcuts, destructive rows, original submenus, and searchable single/multi select subpanels. |

## Important bundled APIs and patterns

These are real reusable features, but they are not separate registry install names.

### FieldError can be used anywhere

`field-error` is an installable registry component despite not currently having its own
inspector page. Its name describes the common use, not a technical restriction. It has no
field-provider dependency, so it can also present a save error, form error, or another
short inline error message.

```tsx
import { FieldError } from "@/components/ui/field-error";

<FieldError>Could not save your changes.</FieldError>
```

When it describes a specific field, connect it to that field for assistive technology:

```tsx
<Input
  aria-invalid={Boolean(error)}
  aria-describedby={error ? "email-error" : undefined}
/>
<FieldError id="email-error">{error}</FieldError>
```

### Disable press scaling when needed

Buttons scale to `0.95` while pressed by default. Set `pressScale={false}` when the
control is an anchored trigger and its visual resize would make the attached panel feel
like it moves. The default remains enabled for ordinary buttons.

```tsx
<Button pressScale={false}>Open menu</Button>
<Toggle pressScale={false} aria-label="Filter" />
```

`ActionButton`, `CopyButton`, and `DeleteButton` inherit the same Button prop.

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

### The four installable Select implementations

| Install name | Trigger model | Panel motion | Search |
| --- | --- | --- | --- |
| `select` | Button/field trigger | Scale, blur, and fade | Optional search inside the panel |
| `select-search` | Editable Combobox input | Standard positioned panel entrance | The trigger itself is the search field |
| `select-motion` | Button/field trigger | Hand-animated unfolding panel | Optional search inside the panel |
| `select-motion-search` | Editable Combobox input | Unfolds from the field | The trigger itself is the search field |

Single and multi-selection are supported across the family. Multi-selection uses the
Checkbox component. `SelectSortTrigger` belongs only to the base `select` item.

### Command Palette composition

The registry item includes more than the root popup:

- root groups and rows with icons, descriptions, badges, keybinds, and destructive state;
- nested item lists;
- arbitrary custom panels opened through `helpers.openPanel`;
- custom panel header search fields or traditional text fields;
- Escape-to-clear for `type="search"` header fields, while traditional text fields use Escape to go back;
- per-panel `headerActions`, suitable for Select and Select Sort controls;
- custom list rows with trailing badges or selection checkboxes;
- grouped action panels with section labels, icons, keybinds, search, and destructive actions.

The demo's Projects, Rename Project, and New Project flows are examples built from these
public APIs, not hard-coded private behaviour.

### Dropdown Menu nested panels

`dropdown-menu` includes three reusable nested-panel forms:

- the original navigation submenu;
- a single-select panel with the chosen value shown in the parent row and a checkmark in
  the panel;
- a multi-select panel using small Checkbox components and an `N selected` parent label.

Single- and multi-select panels can include in-panel search. Their parent highlight stays
active while the pointer is on the parent, inside the nested panel, or moving through the
safe pointer corridor.

### Sidebar composition and layout

`sidebar` is the low-level component family. It includes default, floating, inset, and
split forms; collapsible sections; per-row actions; badges; nested rows; header search or
button controls; and row skeletons. Menus such as the three-dot action menu are composed
with `dropdown-menu` by the consumer.

`sidebar-layout` is intentionally separate but installable. It is the reusable application
frame around Sidebar, not behaviour that every Sidebar user must accept. It supplies the
inset page surface, header title, left-side collapse control, and optional right-side header
actions.

## Inspector and registry parity

The inspector is a visual review site, not the registry itself.

### Registry items without their own inspector entry

| Registry item | Where it is represented |
| --- | --- |
| `field-error` | Installable and documented here; currently no visual inspector entry. |
| `text-shimmer` | Installable and documented here; currently no visual inspector entry. |
| `sidebar-layout` | Installable companion used by the Sidebar layout concept; currently no separate inspector entry. |

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

