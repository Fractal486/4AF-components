# 4AF Components

The documentation is organized by topic instead of duplicated in one registry essay:

- [Overview](content/docs/index.mdx)
- [Generated component catalog](content/docs/reference/components.mdx)
- [CLI reference](content/docs/reference/cli.mdx)
- [Design system](content/docs/reference/design.mdx)
- [Engineering contract](content/docs/reference/engineering.mdx)
- [Agent skill](.agents/skills/4af-components/SKILL.md)

Component-specific APIs and composition guidance live on the matching page under
[`content/docs/`](content/docs/). Agents can print one page as plain Markdown with
`pnpm 4af docs <component>`. `registry.json`, component source, and `pnpm 4af list` remain
authoritative for installable items.

`ActionButton` defaults to a label beside its pending loader. Use `pendingMode="icon"` for a
centered loader-only pending state; it keeps the label-sized content box so the button does not
resize while the action runs.

The table family is split on state. `table` presents rows — densities, borders, a pinned header,
a caption, a loading state — and has no controls at all. `data-table` composes it and adds every
control: the checkbox column, the selection action row, column sorting, and the per-row actions
column. Open a gutter column on the root (`selectable`, `actionColumn`), never by writing cells
into individual rows.

Both Table of Contents variants own their constrained navigation rail: set a height with
`className`, pass `rootRef` for an independently scrolling article, and they will keep the active
entry centered while hiding only the rail's browser scrollbar. Their heading tracking and
click-to-scroll behavior comes from the shared `table-of-contents-tracking` helper.

`SidebarMenuCollapsible` is the expandable-row primitive inside `sidebar`; its trigger includes
a trailing `ChevronDown` by default and rotates it from right to down as the panel opens. Pass
`chevron={false}` when supplying a custom indicator. A sibling `SidebarMenuAction` is laid out
immediately before the chevron. A sibling `SidebarMenuBadge` reserves a slot before the action
and chevron, so counters do not overlap either control. Hovering nested rows keeps the highlight
on the row under the pointer rather than highlighting the collapsible parent. `SidebarGroup`
remains a visual grouping
wrapper and is not collapsible on its own.

The `select` family includes `SelectSeparator` for accessible dividers between option groups.
It is a Base UI list part, not an option, so it stays out of highlighting and selection. The
opt-in `clearable` footer uses a compact `xs` ghost Button and includes a `SelectSeparator` above
it by default. Multi-select submenu triggers show their selected-child count before the chevron.
The `select` and `select-aligned` triggers also accept `variant="ghost"`: Button ghost colors with
the default trigger geometry, keeping leading and trailing icons aligned.
They also accept an optional dimmed `label` before the value, such as `Fruit: Banana`.
The base `select` also accepts `size="xs"` for a 24px trigger and popup rows; `sm` and `md`
remain the 30px and 34px shared sizes.
`select-aligned` additionally accepts `size="xs"` for a 24px trigger and popup rows; `sm` and
`md` keep the trigger and rows at their matching sizes.

`MatrixLoader` is the compact 4×4 status loader. Use `variant` for the scan or twinkle
delay pattern, and `label` only when the loader itself should announce the
busy state.
