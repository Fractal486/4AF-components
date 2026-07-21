---
name: 4af-components
description: Install, inspect, update, and integrate components from the private 4AF React component library using its deterministic CLI. Use when an agent needs to add a 4AF component to another project, check whether a target project is ready, list available components, or work on the 4AF registry and its install workflow.
---

# 4AF Components

Use the repository CLI as the source of truth for component installation. Do not manually
copy files, reconstruct registry URLs, or duplicate the CLI's registry-server logic.

The library repository is normally at `C:\Files\Development\4AF-components`. If it is
elsewhere, locate the repository by finding the directory that contains `registry.json`
and `scripts/4af.mjs`.

## Install into another project

Run these commands from the library repository:

```text
pnpm 4af list
pnpm 4af doctor --project <absolute-target-project>
pnpm 4af install <component> --project <absolute-target-project>
```

If the current working directory is the target project, use `pnpm --dir` with the library
path, for example:

```text
pnpm --dir C:\Files\Development\4AF-components 4af install button --project C:\Projects\my-app
```

The install command builds the registry, starts a temporary local registry server, invokes
shadcn non-interactively, and stops the server afterward. It does not require the 4AF
development server to be running. The 4AF theme, shared `cn` utility, and motion presets
are pulled in through registry dependencies automatically.

Available UI components are discoverable with `pnpm 4af list`; the current set includes
`button`, `input`, `toggle`, `morph`, `action-button`, `copy-button`, and `tabs`.

## Safety and target checks

Run `doctor` before installing when the target is unfamiliar. The target must contain:

- `package.json`
- `components.json`
- `components.json` aliases for `ui` and `lib`

Use `--dry-run` to inspect the component, file count, and existing-file conflicts without
writing. Installation refuses existing target files by default. Pass `--overwrite` only
when replacing those files is intentional and understood.

After installation, inspect the target diff and run the target project's normal checks,
at minimum its typecheck or production build when available. Do not run the library
repository's `pnpm build` while its `pnpm dev` server is active; both use `.next/`.

## Working on the library itself

Keep the dependency direction one-way: `app` imports `inspector`, and `inspector` imports
`registry`; `registry` must not import either of the other layers. Use Base UI for behavior,
keep variants in sibling `.variants.ts` files, and use the shared semantic theme tokens.

When changing registry metadata or components, verify with:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm registry:validate
pnpm registry:build
```

The CLI is the executable workflow. Keep this skill focused on choosing and invoking the
CLI; do not reimplement installation behavior in the skill.
