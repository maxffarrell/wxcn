# Contributing to wxcn

wxcn distributes editable source through each framework's native shadcn registry. Svelte is implemented; React and Vue are reserved for future contributions.

## Workspace

| Directory                                | Responsibility                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `apps/web`                               | Astro website, documentation, preview shell, and NWS/NOAA endpoints       |
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

Production runs on Cloudflare Workers at `https://wxcn.dev`. Run `pnpm run deploy` from the repository root after `wrangler whoami` confirms the intended account. `apps/web/wrangler.jsonc` owns the Worker, static assets, and custom domain configuration. The Astro Cloudflare adapter writes `apps/web/dist/server/wrangler.json` and `apps/web/dist/client`. The root build also writes Wrangler’s supported `.wrangler/deploy/config.json` redirect, so Cloudflare Builds can run its default `npx wrangler deploy` from the workspace root. Use root directory `/` and build command `pnpm build`. Documentation source transforms and syntax highlighting run at build time to keep Node-only tooling out of the Worker. `pnpm dev`, `pnpm check`, and `pnpm build` generate that data automatically.

The root workspace is private, and framework/core packages are private while their npm distribution contracts are being established. Registry installation remains the supported distribution path.

### GitHub deployments

CI uses the latest verified action releases. After validation, pushes to `main` deploy to the GitHub `production` environment at `https://wxcn.dev`. Same-repository pull requests deploy isolated `wxcn-pr-<number>` Workers to the `preview` environment; closing the PR removes that Worker. Fork pull requests run checks without deployment credentials. The manual workflow defaults to a separate preview; production is restricted to `main`.

Set the repository secret `CLOUDFLARE_API_TOKEN` to a durable Cloudflare API token with Workers Scripts: Edit and Workers Routes: Edit for the deployment account, and Zone: Read for `wxcn.dev`. The local Wrangler OAuth login is not a CI credential. GitHub environments record deployment status and URLs. Preview configuration has no custom-domain routes, so it cannot replace `wxcn.dev`.

### Website framework integrations

Astro owns routes in `apps/web/src/pages`, API endpoints, and Markdown content negotiation in `src/middleware.ts`. Interactive Svelte pages live in `src/lib/pages`; the shared shell provides their theme, tooltip, icon, and page-URL context. MDSX documentation uses `.svx` to avoid conflicting with Astro’s native Markdown renderer.

Future React and Vue contributions should add their Astro integration and separate preview islands alongside the Svelte previews. Keep implementations in `packages/react` and `packages/vue` and register their framework adapters; do not import Svelte primitives into those packages. Full-page navigation crosses islands, while playground query changes update the local Svelte page context and browser history.
