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
