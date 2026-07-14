# 4AF Components

A private React component library and a small inspector for reviewing each component in
isolation. Components are copied into other projects through a local shadcn registry, so
you keep ownership of the source instead of installing a public npm package.

## Structure

```text
registry/     Reusable components, utilities, and motion presets
inspector/    Demos, settings, variant matrices, and review notes
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
pnpm registry:validate   # Validate registry.json and its files
pnpm registry:build      # Generate private install files in public/r
```

> [!WARNING]
> Never run `pnpm build` while `pnpm dev` is running. Both use `.next`, and doing so can
> make the development page appear without styles.

## Install a component in another project

1. In this repository, run:

   ```bash
   pnpm registry:build
   pnpm dev
   ```

2. In the project receiving the component, run:

   ```bash
   pnpm dlx shadcn@latest add http://localhost:3000/r/button.json
   ```

Replace `button` with `toggle`, `morph`, `action-button`, `copy-button`, or `tabs`.
Dependencies and the 4AF theme are included automatically.

## Component families

- **Button** — a standard action with variants, sizes, loading, and `asChild`.
- **Toggle** — a pressed/unpressed control backed by Base UI.
- **Morph** — an animated content swap used by status-driven controls.
- **Action Button** — runs asynchronous work and displays pending/success/error states.
- **Copy Button** — an Action Button specialized for clipboard writes.
- **Tabs** — accessible Base UI tabs with a travelling Motion indicator.

The five tabs shown on the Button inspector page are five related installable pieces, not
five components nested inside Button.
