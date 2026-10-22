# 4AF Component Catalog for Agents

Use this chooser to select an installable component. `registry.json` holds the current install
names, and `https://4af.selfsimilar.dev/docs/<component>.md` has each component's complete API,
notes, and install/usage examples. The links below open the same owning documentation pages.

## Sources of truth

- `https://4af.selfsimilar.dev/r/registry.json` lists every install name, its files, and its
  dependencies; `npx shadcn@latest search` reads it.
- `https://4af.selfsimilar.dev/docs/<name>.md` is each component's full reference: API, notes,
  install command, and usage example.
- A bundled export such as `SelectSortTrigger` installs with `select`, not as a separate item.
- `https://4af.selfsimilar.dev/docs/reference/design.md` covers shared geometry and tokens;
  `https://4af.selfsimilar.dev/docs/reference/engineering.md` covers the component contract,
  shared utilities, and loading indicators.

## Installable catalog

The catalog contains 48 installable UI items.

### Actions

| Install name and docs | Choose it for |
| --- | --- |
| [`button`](https://4af.selfsimilar.dev/docs/button.md) | Immediate actions, links styled as buttons, and icon controls. |
| [`button-group`](https://4af.selfsimilar.dev/docs/button-group.md) | Related buttons joined into one visual group; each keeps its own tab stop. |
| [`toggle`](https://4af.selfsimilar.dev/docs/toggle.md) | A pressed state that changes immediately. |
| [`action-button`](https://4af.selfsimilar.dev/docs/action-button.md) | An async action with temporary success or error feedback. |
| [`action-toggle`](https://4af.selfsimilar.dev/docs/action-toggle.md) | A pressed state that changes only after an async action succeeds. |
| [`copy-button`](https://4af.selfsimilar.dev/docs/copy-button.md) | Clipboard actions with confirmation. |
| [`delete-button`](https://4af.selfsimilar.dev/docs/delete-button.md) | A destructive action confirmed by a second press. |
| [`morph`](https://4af.selfsimilar.dev/docs/morph.md) | Animated replacement of text or icons with reserved space. |

### Fields and selection

| Install name and docs | Choose it for |
| --- | --- |
| [`input`](https://4af.selfsimilar.dev/docs/input.md) | Text or number entry, with optional leading icons. |
| [`textarea`](https://4af.selfsimilar.dev/docs/textarea.md) | Multiline text entry with a bordered or plain treatment. |
| [`switch`](https://4af.selfsimilar.dev/docs/switch.md) | An on/off setting. |
| [`checkbox`](https://4af.selfsimilar.dev/docs/checkbox.md) | Boolean or indeterminate selection. |
| [`radio`](https://4af.selfsimilar.dev/docs/radio.md) | One choice from a visible group. |
| [`slider`](https://4af.selfsimilar.dev/docs/slider.md) | A numeric value or range selected along a rail. |
| [`select`](https://4af.selfsimilar.dev/docs/select.md) | Single or multiple selection from a button trigger; optional panel search and nested options. |
| [`select-search`](https://4af.selfsimilar.dev/docs/select-search.md) | Single or multiple selection with an editable search field as the trigger. |
| [`select-aligned`](https://4af.selfsimilar.dev/docs/select-aligned.md) | Single selection aligned over its button trigger when space and input method allow. |
| [`date-picker`](https://4af.selfsimilar.dev/docs/date-picker.md) | Date or date-range entry; also bundles the standalone Calendar. |

### Feedback and status

| Install name and docs | Choose it for |
| --- | --- |
| [`progress`](https://4af.selfsimilar.dev/docs/progress.md) | Determinate progress with optional nested label and formatted value parts. |
| [`alert`](https://4af.selfsimilar.dev/docs/alert.md) | An inline status message or an associated field error. |
| [`badge`](https://4af.selfsimilar.dev/docs/badge.md) | A compact status, category, or count. |
| [`skeleton`](https://4af.selfsimilar.dev/docs/skeleton.md) | A placeholder shaped like loading content. |
| [`empty`](https://4af.selfsimilar.dev/docs/empty.md) | An empty state with optional action. |
| [`text-shimmer`](https://4af.selfsimilar.dev/docs/text-shimmer.md) | A looping highlight for a work-in-progress label. |
| [`scramble-text`](https://4af.selfsimilar.dev/docs/scramble-text.md) | A brief random-character text reveal. |
| [`blur-text`](https://4af.selfsimilar.dev/docs/blur-text.md) | Text that blurs and rises in, letter by letter or word by word. |
| [`ascii-loader`](https://4af.selfsimilar.dev/docs/ascii-loader.md) | A compact text spinner. |
| [`matrix-loader`](https://4af.selfsimilar.dev/docs/matrix-loader.md) | A grid of animated dots. |
| [`classic-loader`](https://4af.selfsimilar.dev/docs/classic-loader.md) | The default radial spinner, installed automatically with loading components. |

### Navigation and layout

| Install name and docs | Choose it for |
| --- | --- |
| [`breadcrumb`](https://4af.selfsimilar.dev/docs/breadcrumb.md) | A navigation trail with optional expandable middle items. |
| [`tabs`](https://4af.selfsimilar.dev/docs/tabs.md) | Switching between content panels. |
| [`collapsible`](https://4af.selfsimilar.dev/docs/collapsible.md) | Showing or hiding a section. |
| [`table`](https://4af.selfsimilar.dev/docs/table.md) | Presenting rows without selection, sort controls, or row menus. |
| [`data-table`](https://4af.selfsimilar.dev/docs/data-table.md) | Tables with selection, sort controls, or row menus; the caller orders the data. |
| [`table-of-contents`](https://4af.selfsimilar.dev/docs/table-of-contents.md) | Heading navigation with a rail and spanning or single-heading marker. |
| [`table-of-contents-lines`](https://4af.selfsimilar.dev/docs/table-of-contents-lines.md) | Compact heading navigation drawn as depth-aware lines. |
| [`separator`](https://4af.selfsimilar.dev/docs/separator.md) | A horizontal or vertical divider. |
| [`command-palette`](https://4af.selfsimilar.dev/docs/command-palette.md) | Command search, nested lists, or custom panels, including async search. |
| [`sidebar`](https://4af.selfsimilar.dev/docs/sidebar.md) | Responsive navigation, including split rail/panel layouts. |
| [`sidebar-layout`](https://4af.selfsimilar.dev/docs/sidebar-layout.md) | A viewport and scrolling shell with a surface-colored header and custom title content. |

### Overlays and menus

| Install name and docs | Choose it for |
| --- | --- |
| [`tooltip`](https://4af.selfsimilar.dev/docs/tooltip.md) | A short hover or focus description. |
| [`sheet`](https://4af.selfsimilar.dev/docs/sheet.md) | A dialog entering from an edge. |
| [`dialog`](https://4af.selfsimilar.dev/docs/dialog.md) | A centered dialog, including bundled multi-step flows. |
| [`alert-dialog`](https://4af.selfsimilar.dev/docs/alert-dialog.md) | A confirmation dialog that blocks backdrop dismissal. |
| [`popover`](https://4af.selfsimilar.dev/docs/popover.md) | An interactive panel anchored to a trigger. |
| [`selection-toolbar`](https://4af.selfsimilar.dev/docs/selection-toolbar.md) | Actions on selected text, with the captured text and range passed to handlers. |
| [`hover-card`](https://4af.selfsimilar.dev/docs/hover-card.md) | A rich preview opened by hover or focus. |
| [`dropdown-menu`](https://4af.selfsimilar.dev/docs/dropdown-menu.md) | Action menus, checkable rows, submenus, or nested searchable selection panels. |

## Bundled composition choices

Loading controls accept a `loader` node or inherit `LoaderProvider`. Morph's hidden sizing
copies reserve that slot without mounting its indicator, so idle controls do not run loader timers.

Use the host component's parts instead of rebuilding their state handling:

| Need | Bundled API and owning docs |
| --- | --- |
| A compact sort/filter select trigger | `SelectSortTrigger` in [Select](https://4af.selfsimilar.dev/docs/select.md) |
| Temporary async feedback in a menu | `DropdownMenuActionItem` in [Dropdown Menu](https://4af.selfsimilar.dev/docs/dropdown-menu.md) |
| Persistent checked state after an async menu action | `DropdownMenuCheckboxItem` with `action` in [Dropdown Menu](https://4af.selfsimilar.dev/docs/dropdown-menu.md) |
| Tabs within a command panel | `CommandPanelTabs` in [Command Palette](https://4af.selfsimilar.dev/docs/command-palette.md) |
| Actions and toggles over selected text | The matching item parts in [Selection Toolbar](https://4af.selfsimilar.dev/docs/selection-toolbar.md) |
| An expandable sidebar row | `SidebarMenuCollapsible` in [Sidebar](https://4af.selfsimilar.dev/docs/sidebar.md) |
| A validated multi-step dialog | `DialogSteps` and `DialogStep` in [Dialog](https://4af.selfsimilar.dev/docs/dialog.md) |

## Component modules

An installable component can span several files. Consumers still import its public API from
`@/components/ui/<name>`; follow that entry point's re-exports when locating implementation
or prop types. Internal modules import their dependencies directly, without importing back
through the public entry point.

The following files install together into the project's UI directory. Sibling suffixes below
include the component name: for example, `.context.ts` means `select.context.ts`.

| Component | Public entry point | Internal siblings |
| --- | --- | --- |
| `command-palette` | `command-palette.tsx`: root state and navigation | `.types.ts`, `.context.ts`, `.search.ts`, `.keybinds.ts`, `.panels.tsx`, `.actions.tsx`, `.chrome.tsx`, `.tabs.tsx`, `.variants.ts` |
| `select` | `select.tsx`: root state and option registration | `.context.ts`, `.shared.tsx`, `.utils.ts`, `.trigger.tsx`, `.content.tsx`, `.sub.tsx`, `.item.tsx`, `.variants.ts` |
| `dropdown-menu` | `dropdown-menu.tsx`: public re-exports | `.menu.tsx`, `.select.tsx`, `.actions.tsx`, `.shared.tsx` |
| `sidebar` | `sidebar.tsx`: responsive shell | `.context.ts`, `.provider.tsx`, `.controls.tsx`, `.structure.tsx`, `.menu.tsx`, `.variants.ts` |
| `selection-toolbar` | `selection-toolbar.tsx`: selection tracking and positioning | `.context.ts`, `.controls.tsx`, `.variants.ts` |
| `date-picker` | `date-picker.tsx`: `DatePicker`, `DateRangePicker`, re-exported `Calendar` | `calendar.tsx`, `.utils.ts`, `.variants.ts` |
| `slider` | `slider.tsx`: `Slider` | `slider-geometry.ts`: thumb and fill positioning; `.variants.ts` |

These siblings are part of the same registry item, not separate install names; installing the
component writes all of them. `select-aligned` and `select-search` are separate installable
items.
