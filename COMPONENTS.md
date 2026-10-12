# 4AF Components

## Documentation index

- [Overview](content/docs/index.mdx)
- [Generated component catalog](content/docs/reference/components.mdx)
- [Installation](content/docs/reference/installation.mdx)
- [Design system](content/docs/reference/design.mdx)
- [Engineering contract](content/docs/reference/engineering.mdx)
- [Agent skill](.agents/skills/4af-components/SKILL.md)
- [Component chooser for agents](.agents/skills/4af-components/references/component-catalog.md)

## Sources of truth

Component APIs, examples, and composition guidance belong on the matching page under
[`content/docs/`](content/docs/). The site serves each page as plain Markdown at
`/docs/<component>.md`, including its canonical install and usage examples from
[`lib/component-reference.ts`](lib/component-reference.ts).

[`registry.json`](registry.json) defines the installable catalog;
[`registry/ui/`](registry/ui/) defines the implementation and props. The website catalog and
count are generated from the registry. Demo entries illustrate usage and do not define install
boundaries.

Loading components install the shared loader utility and `ClassicLoader` as their default
indicator. See [shared loading indicators](content/docs/reference/engineering.mdx#shared-loading-indicators)
for provider overrides and alternative loaders.

Mobile Sidebar panels use Sheet's full-slide exit. See [Sheet](content/docs/sheet.mdx)
for `exitMotion` and [Sidebar](content/docs/sidebar.mdx) for mobile navigation behavior.

When API or behavior changes, update its owning component page and canonical usage reference.
Keep this file as an index and the agent chooser focused on selecting components; link to the
owning page instead of adding another copy of its API guidance.
