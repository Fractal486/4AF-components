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

The catalog contains 55 installable UI items.

Swap props apply only to the named parts, not automatically to every export in an install.
`render` uses Base UI composition; `asChild` uses the local Slot helper. "None" means the
component keeps its own element. Content slots and render callbacks for data are separate APIs.

### Actions

| Install name and docs | Choose it for | Swap prop |
| --- | --- | --- |
| [`button`](https://4af.selfsimilar.dev/docs/button.md) | Immediate actions, links, icon controls, and popup triggers that keep their anchor and open styling. | `asChild`. |
| [`button-group`](https://4af.selfsimilar.dev/docs/button-group.md) | Related buttons, and optionally Input, Select, AlignedSelect, SearchSelect, or DatePicker fields, joined into one visual group; each keeps its own tab stop. | None. |
| [`toggle`](https://4af.selfsimilar.dev/docs/toggle.md) | A pressed state that changes immediately, with independent icon/background fills, custom rendering, and state-aware styling. | `render`. |
| [`action-button`](https://4af.selfsimilar.dev/docs/action-button.md) | Internal or externally controlled async feedback, with per-outcome reset timing and errors held by hover or keyboard focus. | None. |
| [`action-toggle`](https://4af.selfsimilar.dev/docs/action-toggle.md) | A persistent pressed state with async commits, independent controlled feedback, readable errors, and reset controls. | `render`. |
| [`copy-button`](https://4af.selfsimilar.dev/docs/copy-button.md) | Clipboard actions with confirmation. | None. |
| [`delete-button`](https://4af.selfsimilar.dev/docs/delete-button.md) | A destructive action confirmed by a second press. | None. |
| [`morph`](https://4af.selfsimilar.dev/docs/morph.md) | Animated replacement of text or icons with reserved space, or measured current width for changing labels; Badge uses this sizing for smooth text-width changes. Native span props and refs reach the root; measured current width overrides style.width. | None; fixed span. |

### Fields and selection

| Install name and docs | Choose it for | Swap prop |
| --- | --- | --- |
| [`field`](https://4af.selfsimilar.dev/docs/field.md) | A label, description, and error around any form control; marks required controls with `*` or optional ones with "(optional)", read from the control's `required`. Also server error lists, a validity status mark, horizontal Switch/Checkbox rows, and fieldsets and groups that set the marker convention once. | `render` on Field, FieldSet, Legend, Label, Description, and Error. |
| [`input`](https://4af.selfsimilar.dev/docs/input.md) | Text or number entry with automatic native validation styling, `InputCount`, optional leading icons, and a trailing action button. | `render` on Input; InputCount has a fixed element. |
| [`textarea`](https://4af.selfsimilar.dev/docs/textarea.md) | Auto-growing multiline entry with row limits, Base UI Field integration, native validation styling, and optional submit shortcuts. | None; the textarea element is fixed. |
| [`switch`](https://4af.selfsimilar.dev/docs/switch.md) | An on/off setting with dragging, optimistic async saves, shared loaders, on/off marks, and custom rendering. | `render`. |
| [`checkbox`](https://4af.selfsimilar.dev/docs/checkbox.md) | Boolean or indeterminate selection; CheckboxGroup shares values with select-all parents and controlled nested groups. | `render` on Checkbox and CheckboxGroup. |
| [`radio`](https://4af.selfsimilar.dev/docs/radio.md) | One choice from a visible group; custom rendering, state-based classes, and Field validation styling. | `render` on Radio and RadioGroup. |
| [`slider`](https://4af.selfsimilar.dev/docs/slider.md) | A numeric value or draggable range along a horizontal or vertical rail, with formatted and spoken values. | `render`. |
| [`scrub-slider`](https://4af.selfsimilar.dev/docs/scrub-slider.md) | A number in a compact card with a label and dimmed unit: drag along a ruler (edge scrolling for long ranges), click to type, or nudge with chevrons; design-tool properties such as width, opacity, or angle. | `render`. |
| [`select`](https://4af.selfsimilar.dev/docs/select.md) | Single or multiple selection from a button trigger; named sections, panel search, nested options, state-based classes, Field errors, and popup containers. | `render` on Trigger, SortTrigger, Value, Content, Item, Group, GroupLabel, Separator, and SubContent. |
| [`select-search`](https://4af.selfsimilar.dev/docs/select-search.md) | Single or multiple selection with an editable search field, filtered sections, state-based classes, Field errors, and popup containers. | `render` on Input, Content, Group, GroupLabel, Item, and MultiSelectItem. |
| [`select-aligned`](https://4af.selfsimilar.dev/docs/select-aligned.md) | Single selection aligned over its trigger, searchable sections, state-based classes, Field errors, and popup containers. | `render` on Trigger, Content, Group, GroupLabel, and Item. |
| [`date-picker`](https://4af.selfsimilar.dev/docs/date-picker.md) | Single-date, multiple separate dates, or date-range entry; also bundles the standalone Calendar. | None; picker triggers have fixed elements. |

### Feedback and status

| Install name and docs | Choose it for | Swap prop |
| --- | --- | --- |
| [`progress`](https://4af.selfsimilar.dev/docs/progress.md) | Determinate or indeterminate bars and rings, stacked segments, custom colors, and nested label/value parts. | `render` on Progress, ProgressCircle, Value, and Label. |
| [`alert`](https://4af.selfsimilar.dev/docs/alert.md) | Inline status or field error, with optional title, description, custom icons, and controlled dismissal. | `render` on Alert, Title, Description, and Close. |
| [`number-animation`](https://4af.selfsimilar.dev/docs/number-animation.md) | Rolling numbers with motion blur, locale formatting, prefix/suffix, and reduced-motion support; used by Badge, Slider, and Progress. | `render`. |
| [`badge`](https://4af.selfsimilar.dev/docs/badge.md) | Compact statuses, removable tags, pulsing dots, and rolling counts; four appearances, neutral text, custom rendering, and truncation or wrapping. | `render` on Badge and BadgeClose. |
| [`skeleton`](https://4af.selfsimilar.dev/docs/skeleton.md) | Pulsing blocks, content-sized loading wrappers with a reveal fade, inline placeholders, and typography-sized `SkeletonText` lines. | `render` on Skeleton; SkeletonText has a fixed element. |
| [`empty`](https://4af.selfsimilar.dev/docs/empty.md) | Composable empty states with compact sizing, optional staggered entrances, custom elements, and wrapping rich descriptions. | `render` or `asChild` on all parts. |
| [`text-shimmer`](https://4af.selfsimilar.dev/docs/text-shimmer.md) | Color-aware text highlights with one-time or looping playback, active and responsive controls, and native props and refs. | None. |
| [`scramble-text`](https://4af.selfsimilar.dev/docs/scramble-text.md) | A brief random-character text reveal. Native span props and refs reach the root. | None; fixed span. |
| [`blur-text`](https://4af.selfsimilar.dev/docs/blur-text.md) | Text that blurs and rises in, letter by letter or word by word. | None. |
| [`ascii-loader`](https://4af.selfsimilar.dev/docs/ascii-loader.md) | A compact text spinner. Native span props and refs reach the root. | None; fixed span. |
| [`matrix-loader`](https://4af.selfsimilar.dev/docs/matrix-loader.md) | A grid of animated dots. | None. |
| [`classic-loader`](https://4af.selfsimilar.dev/docs/classic-loader.md) | The default radial spinner, installed automatically with loading components. | `asChild`. |

### Navigation and layout

| Install name and docs | Choose it for | Swap prop |
| --- | --- | --- |
| [`breadcrumb`](https://4af.selfsimilar.dev/docs/breadcrumb.md) | A navigation trail with custom element composition, separator styles (slash, chevron, line, dot), sibling-page dropdowns, and middle items collapsed into a dropdown or an animated in-place expansion, with focus transferred after the transition. | `render` or `asChild` on ordinary parts; `render` on BreadcrumbSibling. |
| [`tabs`](https://4af.selfsimilar.dev/docs/tabs.md) | Horizontal or vertical view switching with automatic overflow scrolling, icons, counts, state-based styling, and custom panel elements. | `render` on Tabs, List, Tab, and Panel. |
| [`collapsible`](https://4af.selfsimilar.dev/docs/collapsible.md) | Showing or hiding a section, with custom trigger icons, state-based styling, and gap-aware collapsing. | `render` on Root, Trigger, Content, and TriggerIcon; TriggerIcon also accepts `asChild`. |
| [`table`](https://4af.selfsimilar.dev/docs/table.md) | Presenting rows with pinned columns, wrapping text, cell alignment, and row headings. | None; semantic table elements are fixed. |
| [`data-table`](https://4af.selfsimilar.dev/docs/data-table.md) | Data-driven tables with search, filters, pagination, column visibility, multi-column sorting, disabled selection, and row menus. TanStack Table owns data state; hand-composed rows still work. | `render` on RowActions, Search, Filter, and ViewOptions; table elements are fixed. |
| [`table-of-contents`](https://4af.selfsimilar.dev/docs/table-of-contents.md) | Heading navigation with a rail and spanning or single-heading marker. | None. |
| [`table-of-contents-lines`](https://4af.selfsimilar.dev/docs/table-of-contents-lines.md) | Compact heading navigation drawn as depth-aware lines. | None. |
| [`separator`](https://4af.selfsimilar.dev/docs/separator.md) | A horizontal or vertical hairline with rich labels, alignment, and decorative mode. | `render`. |
| [`scroll-area`](https://4af.selfsimilar.dev/docs/scroll-area.md) | A scroll container with the library's own scrollbar, hover-revealed or always shown, and edge fades on by default. | `render` on ScrollArea and Scrollbar; `viewportProps.render` for the viewport. |
| [`command-palette`](https://4af.selfsimilar.dev/docs/command-palette.md) | Command search, nested lists, or custom panels, including async search. | `render` on CommandPanelTabs, TabList, Tab, and TabPanel; `asChild` on the Kbd re-export. |
| [`kbd`](https://4af.selfsimilar.dev/docs/kbd.md) | Keyboard keycaps and groups with platform-aware labels, sequences, shared compact or medium sizing, context-aware colors, custom icons, and custom element composition. Shared by Command Palette, Dropdown Menu, and Sidebar. | `asChild` on Kbd and KbdGroup. |
| [`sidebar`](https://4af.selfsimilar.dev/docs/sidebar.md) | Responsive navigation with split rail/panel layouts, configurable scoped shortcuts, mobile close-on-navigation, count or dot badges, and badge-replacement actions. Badge counts reuse BadgeCount, with number animation opt-in. | `asChild` on button/link parts and GroupLabel; `render` on Input, Separator, tab parts, and MenuCollapsibleContent. |
| [`sidebar-layout`](https://4af.selfsimilar.dev/docs/sidebar-layout.md) | A viewport and scrolling shell with a surface-colored header and custom title content. | None; use the content slots. |

Grouped Table headers can supply `columnLayouts` for loading and empty rows. Data-driven tables
derive these from visible leaf columns automatically; manual server pagination uses `rowCount`
for row summaries and accepts `pageCount: -1` while the page count is unknown.

### Overlays and menus

| Install name and docs | Choose it for | Swap prop |
| --- | --- | --- |
| [`tooltip`](https://4af.selfsimilar.dev/docs/tooltip.md) | Hover and focus hints with cursor tracking, shared popups, controlled and disabled states, long-content wrapping, and state-aware classes. Use Tooltip for one child, TooltipGroup for several triggers, or TooltipRoot and the separate popup parts for custom composition. | `render` on Trigger, Portal, Positioner, Popup, and Content; Tooltip uses its child as the trigger. |
| [`sheet`](https://4af.selfsimilar.dev/docs/sheet.md) | An edge dialog that adapts to viewport height, with content-sized top/bottom panels and customizable panel, portal, and backdrop. | `render` on Trigger, Close, Portal, Overlay, Content, Title, and Description. |
| [`dialog`](https://4af.selfsimilar.dev/docs/dialog.md) | A centered modal with a separately scrolling body, nested layers, shared trigger payloads, customizable portal/backdrop/popup parts, and bundled multi-step flows. | `render` on Trigger, Close, Portal, Backdrop/Overlay, Popup/Content, Body, Title, and Description. |
| [`alert-dialog`](https://4af.selfsimilar.dev/docs/alert-dialog.md) | Async confirmations with automatic Cancel focus, optional icon media, keyboard footer navigation, and configurable outside dismissal. Reuses and installs Dialog for layout, scrolling, nesting, and motion. | `asChild` on Action, Cancel, and Media; `render` on Trigger and shared Dialog surface parts. |
| [`popover`](https://4af.selfsimilar.dev/docs/popover.md) | An anchored panel with smooth content resizing, automatic Scroll Area overflow, shared trigger handles and payloads, portal options, and state-based classes. Portal, Positioner, and Popup can be composed separately. | `render` on Trigger, Close, Portal, Positioner, Popup/Content, Title, and Description. |
| [`selection-toolbar`](https://4af.selfsimilar.dev/docs/selection-toolbar.md) | Actions on selected text, with the captured text and range passed to handlers. | `asChild` on SelectionToolbar and Button; `render` on Toggle, ActionToggle, ToggleGroup, and Separator. |
| [`hover-card`](https://4af.selfsimilar.dev/docs/hover-card.md) | A hover/focus preview with smooth sizing, stable placement, shared trigger handles and payloads, loading placeholders, Scroll Area overflow, portal options, and state-based classes. | `render` on Trigger, Portal, Positioner, Popup, and Content. |
| [`dropdown-menu`](https://4af.selfsimilar.dev/docs/dropdown-menu.md) | Action menus, checkable rows, submenus, or nested searchable selection panels. Shared payload handles, wrapping labels, state classes, and configurable portal/positioner parts. | `render` on Base UI-backed popup, trigger, group, item, separator, and select-panel parts; `asChild` on Shortcut. CheckboxItem and SelectItem fix their elements. |
| [`context-menu`](https://4af.selfsimilar.dev/docs/context-menu.md) | Right-click and long-press actions on an area or row, anchored at the pointer, with touch hold feedback and a disabled mode that keeps the browser menu. Every Dropdown Menu row and popup part is available as a `ContextMenu*` part; installs Dropdown Menu. | `render` on Trigger, Positioner, Content, and the matching Dropdown Menu parts; `asChild` on Shortcut. |
| [`menubar`](https://4af.selfsimilar.dev/docs/menubar.md) | A desktop-style bar of menus with pointer and arrow-key sweeping, a sliding open-menu highlight, outline or plain bars, two sizes, and vertical layout. Every Dropdown Menu row is available as a `Menubar*` part; installs Dropdown Menu. | `render` on Menubar, Trigger, Content, and the matching Dropdown Menu parts; `asChild` on Shortcut. |

## Bundled composition choices

Kbd and KbdGroup share the kbd install. Command Palette, Dropdown Menu, and Sidebar install and reuse it;
Command Palette retains its existing Kbd re-export for compatibility.

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
| Tabs switching a sidebar's contents | `SidebarTabs` in [Sidebar](https://4af.selfsimilar.dev/docs/sidebar.md) |
| A validated multi-step dialog | `DialogSteps` and `DialogStep` in [Dialog](https://4af.selfsimilar.dev/docs/dialog.md) |

## Component modules

Sidebar page-like collapsible triggers pass `isActive` and select their page in `onClick`.
Inactive pages open or retain their section; active pages toggle it. Omit `isActive` for
disclosure-only triggers that always toggle.
The separate chevron on page-like rows only toggles the section; it never selects the page.

An installable component can span several files. Consumers still import its public API from
`@/components/ui/<name>`; follow that entry point's re-exports when locating implementation
or prop types. Internal modules import their dependencies directly, without importing back
through the public entry point.

The following files install together into the project's UI directory. Sibling suffixes below
include the component name: for example, `.context.ts` means `select.context.ts`.

| Component | Public entry point | Internal siblings |
| --- | --- | --- |
| `kbd` | `kbd.tsx`: `Kbd`, `KbdGroup` | `.keys.ts`: parsing and platform labels; `.variants.ts` |
| `number-animation` | `number-animation.tsx`: `NumberAnimation` | `.css`: rolling geometry, blur, and soft edges; `.variants.ts` |
| `badge` | `badge.tsx`: `Badge`, icons provider, and re-exported parts | `.parts.tsx`: close, dot, count; `.presence.tsx`: visibility animation; `.motion.ts`, `.variants.ts` |
| `input` | `input.tsx`: `Input` and re-exported `InputCount` | `input-count.tsx`: character count and announcements; `.variants.ts` |
| `data-table` | `data-table.tsx`: public composition entry | `.model.tsx`: TanStack hook and column helper; `.content.tsx`: generated rows; `.controls.tsx`: toolbar, search, column filter, View menu, pagination and announcements; `.parts.tsx`: manual rows, selection, sorting and actions; `.variants.ts` |
| `table` | `table.tsx`: semantic table parts | `table-scroll-fade.ts`: automatic pin offsets, pinned-column edge measurement and fade lifecycle; `.variants.ts` |
| `textarea` | `textarea.tsx`: `Textarea` | `textarea-autosize.ts`: height measurement and lifecycle; `.variants.ts` |
| `switch` | `switch.tsx`: `Switch` | `switch-state.ts`: saving and resets; `switch-drag.ts`: pointer gestures and settling; `.variants.ts` |
| `command-palette` | `command-palette.tsx`: root state and navigation | `.types.ts`, `.context.ts`, `.search.ts`, `.keybinds.ts`, `.panels.tsx`, `.actions.tsx`, `.chrome.tsx`, `.tabs.tsx`, `.variants.ts` |
| `select` | `select.tsx`: root state and option registration | `.context.ts`, `.shared.tsx`, `.utils.ts`, `.trigger.tsx`, `.content.tsx`, `.sub.tsx`, `.item.tsx`, `.variants.ts` |
| `dropdown-menu` | `dropdown-menu.tsx`: public re-exports | `.menu.tsx`, `.select.tsx`, `.actions.tsx`, `.shared.tsx`, `.variants.ts` |
| `context-menu` | `context-menu.tsx`: root, trigger with hold feedback, content, positioner, and `ContextMenu*` aliases of the Dropdown Menu rows | `.variants.ts`: trigger hold feedback |
| `menubar` | `menubar.tsx`: bar, menu, trigger, content, and `Menubar*` aliases of the Dropdown Menu rows | `.highlight.ts`: open-trigger measurement for the sliding highlight; `.handoff.ts`: the panel handoff between menus; `.variants.ts` |
| `tooltip` | `tooltip.tsx`: Tooltip, composable parts, shared groups, and typed handles | `.variants.ts`: popup and positioner styles |
| `popover` | `popover.tsx`: root, shared handles, and composable popup parts | `.height.ts`: wrapper for the shared `use-popup-height` utility; `.variants.ts`: panel and typography styles |
| `hover-card` | `hover-card.tsx`: root, shared handles, preview parts, and skeleton | `.position.ts`: stable-side lifecycle; `.variants.ts`: panel styles; installs shared `use-popup-height` for sizing |
| `sidebar` | `sidebar.tsx`: responsive shell | `.context.ts`, `.provider.tsx`, `.controls.tsx`, `.structure.tsx`, `.menu.tsx`, `.tabs.tsx`, `.variants.ts` |
| `selection-toolbar` | `selection-toolbar.tsx`: selection tracking and positioning | `.context.ts`, `.controls.tsx`, `.variants.ts` |
| `date-picker` | `date-picker.tsx`: `DatePicker`, `DateRangePicker`, re-exported `Calendar` | `calendar.tsx`, `.utils.ts`, `.variants.ts` |
| `slider` | `slider.tsx`: `Slider` | `slider-geometry.ts`: thumb and fill positioning; `slider-range-drag.ts`: whole-range pointer gestures; `.variants.ts` |
| `scrub-slider` | `scrub-slider.tsx`: `ScrubSlider` | `scrub-slider-geometry.ts`: ruler, lens, and edge-scroll maths; `.variants.ts` |
| `sheet` | `sheet.tsx`: root and composition parts | `.motion.tsx`: animated custom surfaces; `.variants.ts` |
| `dialog` | `dialog.tsx`: root, shared handles, and composition re-exports | `.shared.tsx`: visual parts and nesting shared with Alert Dialog; `.frame.ts`: natural content measurement; `.steps.tsx`: validated multi-step flows; `.variants.ts` |
| `alert-dialog` | `alert-dialog.tsx`: confirmation surfaces, media, and public re-exports | `.root.tsx`: async coordination and modal root; `.actions.tsx`: action/cancel controls; `.footer.tsx`: Base UI composite navigation; `.variants.ts` |

These siblings are part of the same registry item, not separate install names; installing the
component writes all of them. `select-aligned` and `select-search` are separate installable
items. `select`, `select-aligned`, `select-search`, and `dropdown-menu` each also ship the
same `select.utils.ts` helper at the flat UI alias; it owns dormant-row keyboard resumption
and type/key equivalence for registered icon nodes. Change an icon’s key when its props
change its appearance.
