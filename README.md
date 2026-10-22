<p align="center">
  <img src="./app/icon.png" alt="4AF Components logo" width="160" />
</p>

# 4AF Components

A personal React component library with a self-hosted Fumadocs site for documentation and
interactive component demos, published at https://4af.selfsimilar.dev. Components install
through a public shadcn registry, which copies their source into your project and installs the
packages they depend on. There is no 4AF runtime package.

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
app/          The Next.js shell, docs routes, and exported search index
inspector/    Data-driven demo entries, controls, and schemas
_incoming/    Temporary staging for downloaded components; never imported
```

The dependency direction remains one-way: `app/content/stories` → `inspector` → `registry`.
Anything under `registry/` must remain independent from Next.js, Fumadocs, and the demo
site.

Every installable component has a Fumadocs page with a shared Install & Usage panel.
Component pages load interactive demos from `inspector/entries` through the shared Fumadocs
adapter.

Documentation pages under `/docs/` are also available as Markdown by appending `.md`, for example
`/docs/button.md`. The overview is at `/docs.md`.

## Everyday commands

```bash
pnpm dev                 # Start the Fumadocs development server
pnpm typecheck           # Check TypeScript
pnpm lint                # Check code conventions and portability
pnpm test                # Run component and registry tests
pnpm registry:validate   # Validate registry.json and its files
pnpm registry:build      # Generate install files in public/r (served at /r/*.json)
pnpm build               # Export the complete site to out/ (stop pnpm dev first)
pnpm start               # Preview out/ with Cloudflare Workers at localhost:8787
pnpm test:export         # Verify exported docs, registry, search, and skill ZIP
pnpm benchmark:site      # Measure the running production preview in Chrome
```

> [!WARNING]
> Never run `pnpm build` while `pnpm dev` is running. Both use `.next`, and doing so can
> make the development page appear without styles.

See the [benchmark workflow](benchmarks/README.md) for browser setup, repeatable measurements,
and comparison reports.

## Cloudflare Workers

The production build is a static export. Search runs in the browser using Fumadocs' generated
index; the skill ZIP, Markdown documents, and registry files are produced during the build.
Workers serves the exported files directly; no Worker script is needed. `public/_headers` preserves the search and download
content types, and `public/_redirects` sends `/docs` to the homepage.

Hashed `/_next/static/*` assets are cached for one year with `immutable`. HTML, registry JSON,
Markdown, and `/llms.txt` retain revalidation. All static responses disable MIME sniffing,
use a strict-origin referrer policy, and prevent framing through `frame-ancestors 'none'`.

For local production checks, stop `pnpm dev`, run `pnpm build`, then `pnpm start`.
With that preview running, `pnpm test:export http://127.0.0.1:8787` also checks HTTP routing,
content types, caching and security headers, the download, and search against the Workers server.

When connecting this repository to Workers, use `pnpm build` as the build command,
`pnpm run deploy` as the deploy command, and `pnpm exec wrangler preview` as the preview command.
The build environment needs Node 24.19.0 or newer and pnpm 12.11.2 or newer. These are minimum
requirements with no upper version limit; the repository does not pin a package-manager version.
`wrangler.jsonc` records the static assets directory (`out`), custom 404 behavior, and Worker
name, `4af-components`. Add `4af.selfsimilar.dev` as a custom domain after the first successful
deployment. `pnpm build` and `pnpm start` stay local; `wrangler preview` uploads a remote
preview deployment, and `pnpm run deploy` publishes production.

## Install a component in another project

In a project with a shadcn `components.json`:

```bash
npx shadcn@latest add https://4af.selfsimilar.dev/r/button.json
```

Replace `button` with any name from the catalog. Dependencies and the 4AF theme install with
it. Add `--dry-run` to preview changes first. Unchanged source files are skipped; differing
files prompt before replacement unless `--overwrite` is passed. See the [installation guide](./content/docs/reference/installation.mdx)
for short names, browsing, and updating.

Component pages are also served as Markdown at `/docs/<component>.md`; reference pages retain
their nested paths. `/llms.txt` indexes the component pages and reference sections.

## Component catalog

The website catalog is generated from `registry.json`, which is the authoritative list of
installable names.

## License

Original contributions are licensed under [MIT No Attribution (MIT-0)](LICENSE).
Third-party portions remain subject to their respective licenses, including Animate UI's
additional restriction. See [third-party notices](THIRD_PARTY_NOTICES.md) for upstream
credits and full license texts.
