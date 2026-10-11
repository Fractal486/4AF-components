# 4AF Components

A personal React component library with a self-hosted Fumadocs site for documentation and
interactive component demos, published at https://4af.selfsimilar.dev. Components install
through a public shadcn registry, which copies their source into your project instead of adding
an npm dependency.

Documentation is split by purpose: start with the [overview](./content/docs/index.mdx), then
use the generated [component catalog](./content/docs/reference/components.mdx),
[installation guide](./content/docs/reference/installation.mdx),
[design system](./content/docs/reference/design.mdx), or
[engineering contract](./content/docs/reference/engineering.mdx). Component-specific APIs
and composition guidance live on each component's own page.

## Structure

```text
registry/     Reusable components, utilities, and motion presets
stories/      Shared Fumadocs demo adapter
content/docs/ Fumadocs MDX pages for the complete installable catalog
app/          The Next.js shell, docs routes, and local search endpoint
inspector/    Data-driven demo entries, controls, and schemas
_incoming/    Temporary staging for downloaded components; never imported
```

The dependency direction remains one-way: `app/content/stories` → `inspector` → `registry`.
Anything under `registry/` must remain independent from Next.js, Fumadocs, and the demo
site.

Every installable component has a Fumadocs page with a shared Install & Usage panel.
Component pages load interactive demos from `inspector/entries` through the shared Fumadocs
adapter.

Every page is also available as Markdown by appending `.md` to its URL, for example
`/docs/button.md` or `/docs.md` for the overview.

## Everyday commands

```bash
pnpm dev                 # Open the Fumadocs component site
pnpm typecheck           # Check TypeScript
pnpm lint                # Check code conventions and portability
pnpm test                # Run component and registry tests
pnpm registry:validate   # Validate registry.json and its files
pnpm registry:build      # Generate install files in public/r (served at /r/*.json)
```

> [!WARNING]
> Never run `pnpm build` while `pnpm dev` is running. Both use `.next`, and doing so can
> make the development page appear without styles.

## Install a component in another project

In a project with a shadcn `components.json`:

```bash
npx shadcn@latest add https://4af.selfsimilar.dev/r/button.json
```

Replace `button` with any name from the catalog. Dependencies and the 4AF theme install with
it. Add `--dry-run` to preview every change first; existing files are skipped unless
`--overwrite` is passed. See the [installation guide](./content/docs/reference/installation.mdx)
for short names, browsing, and updating.

Every documentation page is also served as Markdown at `/docs/<component>.md`, and `/llms.txt`
lists them all.

## Component catalog

The website catalog is generated from `registry.json`, which is the authoritative list of
installable names.

## License

Original contributions are licensed under [MIT No Attribution (MIT-0)](LICENSE).
Third-party portions remain subject to their respective licenses, including Animate UI's
additional restriction. See [third-party notices](THIRD_PARTY_NOTICES.md) for upstream
credits and full license texts.
