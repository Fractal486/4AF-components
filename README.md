# 4AF Components

A private React component library and a small inspector for reviewing each component in
isolation. Components are copied into other projects through a local shadcn registry, so
you keep ownership of the source instead of installing a public npm package.

## Structure

```text
registry/     Reusable components, utilities, and motion presets
inspector/    Demos and settings for reviewing components
app/          The small Next.js site that renders the inspector
_incoming/    Temporary staging for downloaded components; never imported
```

The dependency direction is deliberately one-way: `app` → `inspector` → `registry`.
Anything under `registry/` must remain independent from Next.js and the inspector.

## Everyday commands

```bash
pnpm dev                 # Open the inspector
pnpm typecheck           # Check TypeScript
pnpm lint                # Check code conventions and portability
pnpm test                # Run component and registry tests
pnpm 4af list            # List installable components
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
   pnpm 4af install button --project C:\Projects\my-app
   ```

   Replace `button` with `input`, `toggle`, `morph`, `action-button`, `copy-button`, or
   `tabs`.
   The command builds the registry, starts a temporary local registry server, and
   installs the component non-interactively. Add `--overwrite` only when replacing
   existing files is intentional.

2. To check a target project before installing:

   ```bash
   pnpm 4af doctor --project C:\Projects\my-app
   ```

Dependencies and the 4AF theme are included automatically. Agents should use this CLI
instead of manually copying files or running the lower-level shadcn command.

## Component families

- **Button** — a standard action with variants, sizes, loading, and `asChild`.
- **Input** — a Base UI text field with default, plain, and underline variants plus custom number steppers.
- **Toggle** — a pressed/unpressed control backed by Base UI.
- **Morph** — an animated content swap used by status-driven controls.
- **Action Button** — runs asynchronous work and displays pending/success/error states.
- **Copy Button** — an Action Button specialized for clipboard writes.
- **Tabs** — accessible Base UI tabs with a travelling Motion indicator.

The Button family is shown together in the sidebar, while standalone components such as
Input have their own inspector route.
