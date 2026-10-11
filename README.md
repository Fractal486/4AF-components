# 4AF Components

A private React component library with a self-hosted Fumadocs site for documentation and
interactive component demos. Components are copied into other projects through a local
shadcn registry, so you keep ownership of the source instead of installing a public npm
package.

Documentation is split by purpose: start with the [overview](./content/docs/index.mdx), then
use the generated [component catalog](./content/docs/reference/components.mdx),
[CLI reference](./content/docs/reference/cli.mdx),
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
pnpm 4af list            # List installable components
pnpm 4af docs button     # Print a component's complete Markdown reference
pnpm 4af doctor --project <path>
pnpm 4af install button --project <path>
pnpm registry:validate   # Validate registry.json and its files
pnpm registry:build      # Generate private install files in public/r
```

> [!WARNING]
> Never run `pnpm build` while `pnpm dev` is running. Both use `.next`, and doing so can
> make the development page appear without styles.

## Install a component in another project

1. From this repository, run:

   ```bash
   pnpm 4af install button --project /absolute/path/to/my-app
   ```

   Replace `button` with any name shown by `pnpm 4af list`.
   The command builds the registry, starts a temporary local registry server, and
   installs the component non-interactively. Add `--overwrite` only when replacing
   existing files is intentional.

2. To check a target project before installing:

   ```bash
   pnpm 4af doctor --project /absolute/path/to/my-app
   ```

Dependencies and the 4AF theme are included automatically. Agents should use this CLI
instead of manually copying files or running the lower-level shadcn command. `pnpm 4af docs
<component>` prints the matching page's API, notes, install command, and usage example as
plain Markdown.

## Component catalog

The website catalog is generated from `registry.json`. Run `pnpm 4af list` for the exact set
of names accepted by the installer.

## License

Original contributions are licensed under [MIT No Attribution (MIT-0)](LICENSE).
Third-party portions remain subject to their respective licenses, including Animate UI's
additional restriction. See [third-party notices](THIRD_PARTY_NOTICES.md) for upstream
credits and full license texts.
