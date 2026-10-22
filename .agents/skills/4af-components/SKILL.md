---
name: 4af-components
description: Choose, install, and integrate components from the 4AF React component library, a public shadcn registry. Use when an agent needs to discover available 4AF components, compare component families or bundled APIs, read a component's documentation, install a component into a project, check a project is ready, or troubleshoot installation with the shadcn CLI.
---

# 4AF Components

4AF is a public shadcn registry at `https://4af.selfsimilar.dev`. Install and inspect it with
the shadcn CLI. Do not copy component files by hand or guess registry URLs.

## Route the task

- To choose or compare components, or answer feature/API questions, read [references/component-catalog.md](references/component-catalog.md).
- To read one component's complete, agent-friendly reference, fetch
  `https://4af.selfsimilar.dev/docs/<component>.md`: the page's API and notes with separate
  install and usage code blocks. `https://4af.selfsimilar.dev/llms.txt` indexes component pages
  and reference sections.
- To install into another project, use the workflow below.
- For the exact current component list, run
  `npx shadcn@latest search https://4af.selfsimilar.dev/r/registry.json -t ui`. It needs no
  setup and prints each component's description and install URL. Treat the reference catalog as
  a fast guide, not a replacement for it.

## Install into a project

Run in the target project:

```text
npx shadcn@latest info
npx shadcn@latest add https://4af.selfsimilar.dev/r/<component>.json --dry-run
npx shadcn@latest add https://4af.selfsimilar.dev/r/<component>.json
```

The target needs React 19, Tailwind CSS v4, and a shadcn `components.json` with `ui` and `lib` aliases; run
`npx shadcn@latest init` first if it has none. `info` shows the project's setup and resolved
paths. `--dry-run` previews source files, package dependencies, and CSS updates;
`--diff` shows changes to existing files. The theme, shared utilities, and component
dependencies install with the component. Unchanged source files are skipped; differing existing
files prompt before replacement, defaulting to no. `--overwrite` skips those prompts and can
replace local edits, including shared dependencies. Preview an
update with `add <url> --overwrite --diff` before applying `add <url> --overwrite`.

Skipping existing source files does not skip package or stylesheet updates. Component installs
preserve existing CSS variable values, so the target's theme can differ from the demos.
Installing `4af-theme` directly can replace matching variables; preview that operation separately.
The registry does not install Geist fonts. See the
[installation guide](https://4af.selfsimilar.dev/docs/reference/installation.md) for theme and font setup.

To use short names, register the namespace once per project:

```bash
npx shadcn@latest registry add @4af=https://4af.selfsimilar.dev/r/{name}.json
```

Then `npx shadcn@latest add @4af/<component>`, `search @4af`, and `view @4af/<component>` work.

Afterwards inspect the diff and run the target's own typecheck or build.
