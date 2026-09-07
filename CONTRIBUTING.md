# Contributing to wxcn

wxcn distributes editable source through each framework's native shadcn registry. Svelte is implemented; React and Vue are reserved for future contributions.

## Workspace

| Directory                                | Responsibility                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `apps/web`                               | SvelteKit website, documentation, preview shell, and NWS/NOAA endpoints   |
| `packages/core`                          | Framework-independent data types, conversions, calculations, and fixtures |
| `packages/svelte`                        | Native Svelte components, icons, and shadcn primitives used by previews   |
| `packages/react`, `packages/vue`         | Reserved implementation workspaces                                        |
| `apps/preview-react`, `apps/preview-vue` | Reserved native preview apps                                              |
| `tooling/registry`                       | Registry build orchestration and framework-specific transforms            |
| `tooling/contracts`                      | Component availability and shared behavior requirements                   |

Install with `pnpm install`, then run `pnpm dev` from the repository root. Use Node.js 24 or later and the pnpm version declared in `package.json`.

Run `pnpm check`, `pnpm test`, `pnpm lint`, and `pnpm build` before submitting changes. Registry JSON is generated: update source and run `pnpm registry:build` rather than editing generated files.

## Adding a framework

Start with one component. There is no requirement to implement the whole collection in one pull request.

1. Initialize the reserved preview app with the framework's native toolchain and shadcn configuration. Add a root filtered development script when the preview becomes runnable.
2. Add native components and a package export map to the framework package. Import calculations from `@wxcn/core`; keep hooks, lifecycle handling, icons, and charts native to the framework.
3. Implement an adapter in `tooling/registry/adapters`. Use that ecosystem's schema and alias/icon transforms. Emit shared helper source into registry items; installed components must not depend on workspace-only packages.
4. Add the adapter to the registry build. All internal registry dependencies must stay in the same framework. Depend on native `card`, `badge`, and `chart` registry items instead of distributing replacements for consumer primitives.
5. Add the completed item to `tooling/contracts/frameworks.json`. Keep unimplemented items unavailable. Only enable a framework in the website when a working native preview and installation path exist.
6. Add a clean-consumer CLI installation check, type checking, and a production build for that framework. Verify custom aliases, supported icon sets, and existing light/dark themes.

React uses the `shadcn` CLI; Vue uses `shadcn-vue`; Svelte uses `shadcn-svelte`. Registry URLs are `/r/<framework>/<component>.json`. Existing `/r/<component>.json` URLs remain Svelte aliases.

## Component parity

Use the scenarios in [the behavior contract](tooling/contracts/README.md). Preserve the meaning of size, density, unit, and data props while using idiomatic framework syntax. Each framework must use its own native shadcn chart component; sharing a chart implementation across frameworks is not required.

Preserve the exact shadcn-svelte preset codec for Svelte. New frameworks need explicit compatibility tests before claiming matching preset codes or style support. Do not silently approximate unsupported settings.

## Hosting

The Vercel project should use `apps/web` as its Root Directory, with access to files outside that directory enabled. Its build command should run `pnpm --dir ../.. build` so registries are generated before the web app builds. Its install command should run `pnpm install --frozen-lockfile`. Framework preview apps can be deployed independently once implemented; use their native builds for interactive previews.

The root workspace is private, and framework/core packages are private while their npm distribution contracts are being established. Registry installation remains the supported distribution path.
