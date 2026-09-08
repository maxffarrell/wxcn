# Contributing to wxcn

wxcn distributes editable source through each framework's native shadcn registry. Svelte, React, and Vue are implemented.

## Workspace

| Directory            | Responsibility                                                            |
| -------------------- | ------------------------------------------------------------------------- |
| `apps/web`           | Astro website, documentation, preview shell, and NWS/NOAA endpoints       |
| `packages/core`      | Framework-independent data types, conversions, calculations, and fixtures |
| `packages/svelte`    | Native Svelte components, icons, and shadcn primitives used by previews   |
| `packages/react`     | Native React components and preview primitives                            |
| `packages/vue`       | Native Vue components and preview primitives                              |
| `apps/preview-react` | Native React/Vite preview                                                 |
| `tooling/registry`   | Registry build orchestration and framework-specific transforms            |
| `tooling/contracts`  | Component availability and shared behavior requirements                   |

Install with `pnpm install`, then run `pnpm dev` from the repository root. Use Node.js 24 or later and the pnpm version declared in `package.json`.

Run `pnpm check`, `pnpm test`, `pnpm test:react`, `pnpm test:vue`, `pnpm lint`, `pnpm build`, `pnpm build:react`, `pnpm build:vue`, `pnpm test:consumer:react`, and `pnpm test:consumer:vue` before submitting changes. Registry JSON is generated: update source and run `pnpm registry:build` rather than editing generated files.

Project type checks use TypeScript 7 and `svelte-check-native`. Astro’s checker and `vue-tsc` still require the TypeScript 6 JavaScript API, so their compatibility dependencies are isolated in the website and Vue tooling; the native checker uses the root TypeScript 7 compiler for all Svelte sources and consumer checks. `tooling/check-svelte.mjs` preserves pnpm workspace dependency resolution in the native checker’s generated overlays.

## Adding a framework

Start with one component. There is no requirement to implement the whole collection in one pull request.

1. Initialize the reserved preview app with the framework's native toolchain and shadcn configuration. Add a root filtered development script when the preview becomes runnable.
2. Add native components and a package export map to the framework package. Import calculations from `@wxcn/core`; keep hooks, lifecycle handling, icons, and charts native to the framework.
3. Implement an adapter in `tooling/registry/adapters`. Use that ecosystem's schema and alias/icon transforms. Emit shared helper source into registry items; installed components must not depend on workspace-only packages.
4. Add the adapter to the registry build. All internal registry dependencies must stay in the same framework. Depend on native `card`, `badge`, and `chart` registry items instead of distributing replacements for consumer primitives.
5. Add the completed item to `tooling/contracts/frameworks.json`. Keep unimplemented items unavailable. Only enable a framework in the website when a working native preview and installation path exist.
6. Add a clean-consumer CLI installation check, type checking, and a production build for that framework. Verify custom aliases, supported icon sets, and existing light/dark themes.

React uses the `shadcn` CLI; Vue uses `shadcn-vue`; Svelte uses `shadcn-svelte`. Registry URLs are `/r/<framework>/<component>.json`. Existing `/r/<component>.json` URLs remain Svelte aliases. React registry items support Lucide, Tabler, Phosphor, Hugeicons, and Remixicon through the native adapter.

## Component parity

Use the scenarios in [the behavior contract](tooling/contracts/README.md). Preserve the meaning of size, density, unit, and data props while using idiomatic framework syntax. Each framework must use its own native shadcn chart component; sharing a chart implementation across frameworks is not required.

Preserve the exact shadcn-svelte preset codec for Svelte. New frameworks need explicit compatibility tests before claiming matching preset codes or style support. Do not silently approximate unsupported settings.

## Hosting

Production runs on Cloudflare Workers at `https://wxcn.dev`. Cloudflare Workers Builds is the authoritative deployment system for this repository. Its root directory is `/` and its build command is `pnpm build`; the root Wrangler dependency ensures both the default `npx wrangler deploy` and versions upload resolve from the workspace. The build writes Wrangler’s supported `.wrangler/deploy/config.json` redirect. `apps/web/wrangler.jsonc` owns the Worker, static assets, and custom domain configuration. The Astro Cloudflare adapter writes `apps/web/dist/server/wrangler.json` and `apps/web/dist/client`. Documentation source transforms and syntax highlighting run at build time to keep Node-only tooling out of the Worker. `pnpm dev`, `pnpm check`, and `pnpm build` generate that data automatically.

The root workspace is private, and framework/core packages are private while their npm distribution contracts are being established. Registry installation remains the supported distribution path.

### GitHub checks

GitHub Actions runs validation only. Deployment credentials, GitHub deployment environments, PR preview Workers, and preview cleanup are intentionally not configured here; those concerns belong to the linked Cloudflare Workers Builds project.

### Website framework integrations

Astro owns routes in `apps/web/src/pages`, API endpoints, and Markdown content negotiation in `src/middleware.ts`. Interactive Svelte pages live in `src/lib/pages`; the shared shell provides their theme, tooltip, icon, and page-URL context. MDSX documentation uses `.svx` to avoid conflicting with Astro’s native Markdown renderer.

React and Vue are served at `/react` and `/vue` with native framework hosts and component documentation. Keep implementations in `packages/react` and `packages/vue` and register their framework adapters; do not import Svelte primitives into those packages. Full-page navigation crosses framework routes.
