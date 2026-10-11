# 4AF Component Catalog for Agents

Use this chooser to select an installable component. Run `pnpm 4af list` for current install
names and `pnpm 4af docs <component>` for its complete API, notes, and install/usage examples.
The links below open the same owning documentation pages.

## Sources of truth

- `registry.json` defines install names, files, and dependencies; `registry/ui/` defines props
  and behavior. Follow the public entry point's re-exports to locate an implementation.
- `content/docs/<name>.mdx` owns component guidance; `lib/component-reference.ts` owns the
  shared usage snippet rendered by the website and CLI.
- `inspector/entries/` contains demonstrations, not installation boundaries. A bundled export
  such as `SelectSortTrigger` installs with `select`, not as a separate item.
- [Design](../../../../content/docs/reference/design.mdx) owns shared geometry and tokens;
  [Engineering](../../../../content/docs/reference/engineering.mdx) owns the contract,
  shared utilities, and loading-indicator composition.

## Installable catalog

The catalog contains 47 installable UI items.

### Actions

| Install name and docs | Choose it for |
| --- | --- |
| [`button`](../../../../content/docs/button.mdx) | Immediate actions, links styled as buttons, and icon controls. |
| [`button-group`](../../../../content/docs/button-group.mdx) | Related buttons joined into one visual group; each keeps its own tab stop. |
| [`toggle`](../../../../content/docs/toggle.mdx) | A pressed state that changes immediately. |
| [`action-button`](../../../../content/docs/action-button.mdx) | An async action with temporary success or error feedback. |
| [`action-toggle`](../../../../content/docs/action-toggle.mdx) | A pressed state that changes only after an async action succeeds. |
| [`copy-button`](../../../../content/docs/copy-button.mdx) | Clipboard actions with confirmation. |
| [`delete-button`](../../../../content/docs/delete-button.mdx) | A destructive action confirmed by a second press. |
| [`morph`](../../../../content/docs/morph.mdx) | Animated replacement of text or icons with reserved space. |

### Fields and selection

| Install name and docs | Choose it for |
| --- | --- |
| [`input`](../../../../content/docs/input.mdx) | Text or number entry, with optional leading icons. |
| [`textarea`](../../../../content/docs/textarea.mdx) | Multiline text entry. |
| [`switch`](../../../../content/docs/switch.mdx) | An on/off setting. |
| [`checkbox`](../../../../content/docs/checkbox.mdx) | Boolean or indeterminate selection. |
| [`radio`](../../../../content/docs/radio.mdx) | One choice from a visible group. |
| [`slider`](../../../../content/docs/slider.mdx) | A numeric value or range selected along a rail. |
| [`select`](../../../../content/docs/select.mdx) | Single or multiple selection from a button trigger; optional panel search and nested options. |
| [`select-search`](../../../../content/docs/select-search.mdx) | Single or multiple selection with an editable search field as the trigger. |
| [`select-aligned`](../../../../content/docs/select-aligned.mdx) | Single selection aligned over its button trigger when space and input method allow. |
| [`date-picker`](../../../../content/docs/date-picker.mdx) | Date or date-range entry; also bundles the standalone Calendar. |

### Feedback and status

| Install name and docs | Choose it for |
| --- | --- |
| [`progress`](../../../../content/docs/progress.mdx) | Determinate progress. |
| [`alert`](../../../../content/docs/alert.mdx) | An inline status message or an associated field error. |
| [`badge`](../../../../content/docs/badge.mdx) | A compact status, category, or count. |
| [`skeleton`](../../../../content/docs/skeleton.mdx) | A placeholder shaped like loading content. |
| [`empty`](../../../../content/docs/empty.mdx) | An empty state with optional action. |
| [`text-shimmer`](../../../../content/docs/text-shimmer.mdx) | A looping highlight for a work-in-progress label. |
| [`scramble-text`](../../../../content/docs/scramble-text.mdx) | A brief random-character text reveal. |
| [`ascii-loader`](../../../../content/docs/ascii-loader.mdx) | A compact text spinner. |
| [`matrix-loader`](../../../../content/docs/matrix-loader.mdx) | A grid of animated dots. |
| [`classic-loader`](../../../../content/docs/classic-loader.mdx) | A radial spinner made of fading bars. |

### Navigation and layout

| Install name and docs | Choose it for |
| --- | --- |
| [`breadcrumb`](../../../../content/docs/breadcrumb.mdx) | A navigation trail with optional expandable middle items. |
| [`tabs`](../../../../content/docs/tabs.mdx) | Switching between content panels. |
| [`collapsible`](../../../../content/docs/collapsible.mdx) | Showing or hiding a section. |
| [`table`](../../../../content/docs/table.mdx) | Presenting rows without selection, sort controls, or row menus. |
| [`data-table`](../../../../content/docs/data-table.mdx) | Tables with selection, sort controls, or row menus; the caller orders the data. |
| [`table-of-contents`](../../../../content/docs/table-of-contents.mdx) | Heading navigation with a rail and spanning or single-heading marker. |
| [`table-of-contents-lines`](../../../../content/docs/table-of-contents-lines.mdx) | Compact heading navigation drawn as depth-aware lines. |
| [`separator`](../../../../content/docs/separator.mdx) | A horizontal or vertical divider. |
| [`command-palette`](../../../../content/docs/command-palette.mdx) | Command search, nested lists, or custom panels, including async search. |
| [`sidebar`](../../../../content/docs/sidebar.mdx) | Responsive navigation, including split rail/panel layouts. |
| [`sidebar-layout`](../../../../content/docs/sidebar-layout.mdx) | An optional viewport and scrolling shell around Sidebar. |

### Overlays and menus

| Install name and docs | Choose it for |
| --- | --- |
| [`tooltip`](../../../../content/docs/tooltip.mdx) | A short hover or focus description. |
| [`sheet`](../../../../content/docs/sheet.mdx) | A dialog entering from an edge. |
| [`dialog`](../../../../content/docs/dialog.mdx) | A centered dialog, including bundled multi-step flows. |
| [`alert-dialog`](../../../../content/docs/alert-dialog.mdx) | A confirmation dialog that blocks backdrop dismissal. |
| [`popover`](../../../../content/docs/popover.mdx) | An interactive panel anchored to a trigger. |
| [`selection-toolbar`](../../../../content/docs/selection-toolbar.mdx) | Actions on selected text, with the captured text and range passed to handlers. |
| [`hover-card`](../../../../content/docs/hover-card.mdx) | A rich preview opened by hover or focus. |
| [`dropdown-menu`](../../../../content/docs/dropdown-menu.mdx) | Action menus, checkable rows, submenus, or nested searchable selection panels. |

## Bundled composition choices

Use the host component's parts instead of rebuilding their state handling:

| Need | Bundled API and owning docs |
| --- | --- |
| A compact sort/filter select trigger | `SelectSortTrigger` in [Select](../../../../content/docs/select.mdx) |
| Temporary async feedback in a menu | `DropdownMenuActionItem` in [Dropdown Menu](../../../../content/docs/dropdown-menu.mdx) |
| Persistent checked state after an async menu action | `DropdownMenuCheckboxItem` with `action` in [Dropdown Menu](../../../../content/docs/dropdown-menu.mdx) |
| Tabs within a command panel | `CommandPanelTabs` in [Command Palette](../../../../content/docs/command-palette.mdx#panel-tabs) |
| Actions and toggles over selected text | The matching item parts in [Selection Toolbar](../../../../content/docs/selection-toolbar.mdx#item-kinds) |
| An expandable sidebar row | `SidebarMenuCollapsible` in [Sidebar](../../../../content/docs/sidebar.mdx#collapsible-menu-sections) |
| A validated multi-step dialog | `DialogSteps` and `DialogStep` in [Dialog](../../../../content/docs/dialog.mdx) |

## Component modules

An installable component can span several files. Consumers still import its public API from
`@/components/ui/<name>`; follow that entry point's re-exports when locating implementation
or prop types. Internal modules import their dependencies directly, without importing back
through the public entry point.

The following files live together under `registry/ui/<name>/`. Sibling suffixes below include
the component name: for example, `.context.ts` means `select.context.ts` inside `select/`.

| Component | Public entry point | Internal siblings |
| --- | --- | --- |
| `command-palette` | `command-palette.tsx`: root state and navigation | `.types.ts`, `.context.ts`, `.search.ts`, `.keybinds.ts`, `.panels.tsx`, `.actions.tsx`, `.chrome.tsx`, `.tabs.tsx`, `.variants.ts` |
| `select` | `select.tsx`: root state and option registration | `.context.ts`, `.shared.tsx`, `.utils.ts`, `.trigger.tsx`, `.content.tsx`, `.sub.tsx`, `.item.tsx`, `.variants.ts` |
| `dropdown-menu` | `dropdown-menu.tsx`: public re-exports | `.menu.tsx`, `.select.tsx`, `.actions.tsx`, `.shared.tsx` |
| `sidebar` | `sidebar.tsx`: responsive shell | `.context.ts`, `.provider.tsx`, `.controls.tsx`, `.structure.tsx`, `.menu.tsx`, `.variants.ts` |
| `selection-toolbar` | `selection-toolbar.tsx`: selection tracking and positioning | `.context.ts`, `.controls.tsx`, `.variants.ts` |
| `date-picker` | `date-picker.tsx`: `DatePicker`, `DateRangePicker`, re-exported `Calendar` | `calendar.tsx`, `.variants.ts` |

These siblings are part of the same registry item, not separate install names. `registry.json`
declares every shipped file and its target; the CLI installs the complete bundle. The current
targets place the files alongside the public entry point in the consumer's UI directory.
When adding or moving a module, update those file entries and preserve resolving imports.

The other select implementations (`select-aligned` and `select-search`) also live in
`registry/ui/select/`, but are separate installable items.

## Inspector and registry parity

Each installable UI item has its own documentation page. Some pages compose another item's
demo: Sidebar Layout uses the Sidebar demo, while each Table of Contents variant has its own
page and demo. “Select · Sort” demonstrates `SelectSortTrigger`, which installs with `select`.
Demo helpers, sample data, settings controls, and page wrappers are not registry components.
