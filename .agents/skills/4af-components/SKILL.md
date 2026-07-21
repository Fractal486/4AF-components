---
name: 4af-components
description: Choose, install, integrate, inspect, and maintain components in the private 4AF React component library and its shadcn-compatible registry. Use when an agent needs to discover available 4AF components, compare component families or bundled APIs, install a component into another project, verify target readiness, change registry source or inspector demos, update registry metadata or documentation, or troubleshoot the 4AF CLI and installation workflow.
---

# 4AF Components

Use the repository CLI and source as the authority. Do not manually copy component files,
guess registry URLs, or reproduce the CLI's temporary registry-server workflow.

The library repository is normally at `C:\Files\Development\4AF-components`. If it is
elsewhere, locate the directory containing both `registry.json` and `scripts/4af.mjs`.

## Route the task

- To choose or compare components, answer feature/API questions, or check inspector and
  registry parity, read [references/component-catalog.md](references/component-catalog.md).
- To install into another project, use the CLI workflow below.
- To change the library, read the repository's root `AGENTS.md` first, then inspect the
  component source, registry metadata, and inspector entry that are actually in scope.
- For an exact current component list, run `pnpm 4af list`. Treat the reference catalog
  as a fast guide, not a replacement for `registry.json` or source code.

## Install into another project

Run from the library repository, using an absolute target path:

```text
pnpm 4af list
pnpm 4af doctor --project <absolute-target-project>
pnpm 4af install <component> --project <absolute-target-project> --dry-run
pnpm 4af install <component> --project <absolute-target-project>
```

If the current working directory is the target project, use `pnpm --dir` with the library
path, for example:

```text
pnpm --dir C:\Files\Development\4AF-components 4af install button --project C:\Projects\my-app
```

Run `doctor` whenever the target is unfamiliar. The target must contain `package.json`,
shadcn `components.json`, and `ui` and `lib` aliases. Use `--dry-run` to inspect files
and conflicts. Installation refuses existing target files by default; pass `--overwrite`
only when replacement is intentional.

The install command builds and serves the private registry temporarily, invokes shadcn
non-interactively, installs recursive 4AF dependencies and theme files, then stops the
server. The development server does not need to be running.

After installation, inspect the target diff and run the target project's normal checks,
at minimum its typecheck or production build when available. Do not run the library
repository's `pnpm build` while its `pnpm dev` server is active; both use `.next/`.

## Work on the library

Preserve `app -> inspector -> registry`. Never import `app/` or `inspector/` from
`registry/`. Keep portable implementation in `registry/ui/<name>/`, demonstrations and
settings in `inspector/entries/`, and install metadata in `registry.json`.

Follow the root `AGENTS.md` component contract. In particular:

- Use Base UI as the canonical behaviour layer.
- Forward refs and props; support composition and controlled/uncontrolled state where
  applicable.
- Keep CVA variants in the sibling `.variants.ts` file.
- Expose state through attributes such as `data-state`, `data-variant`, and
  `data-loading`.
- Use semantic theme tokens, named transition properties, and duration tokens.
- Avoid animated layout properties and unnecessary Motion runtime code.
- Preserve unrelated work in a dirty worktree.

For a component change:

1. Inspect its registry source, sibling variants and tests, inspector entry, and
   `registry.json` item.
2. Change portable behaviour and API in `registry/`; keep demo-only state in `inspector/`.
3. Update the inspector demonstration when the public feature needs visible coverage.
4. Update `registry.json` when files, dependencies, or installable items change.
5. Update root `COMPONENTS.md` and
   [references/component-catalog.md](references/component-catalog.md) when the public
   catalog, composition guidance, or notable API changes.

## Verify changes

Choose checks proportionate to the files changed:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm registry:validate
pnpm registry:build
```

Run registry validation/build for install metadata or portable component changes. Report
pre-existing failures separately from failures caused by the change.
