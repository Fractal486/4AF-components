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

Both Table of Contents variants own their constrained navigation rail: set a height with
`className`, pass `rootRef` for an independently scrolling article, and they will keep the active
entry centered while hiding only the rail's browser scrollbar.
