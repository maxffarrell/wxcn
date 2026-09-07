# @wxcn/svelte

The existing Svelte implementation, consumed directly by `apps/web`. Components and preview primitives live in `src/components`; `src/icons` provides preview icon selection. Shared forecast data and calculations come from `@wxcn/core`.

Run `pnpm --filter @wxcn/svelte check` to type-check this package. Run `pnpm registry:build` at the root to regenerate its registry manifest and public JSON files. The registry adapter copies core helpers, rewrites workspace imports, and uses native shadcn-svelte transforms for consumer aliases and icons.

This package is private. Consumers install editable source using the registry. The preview's UI primitives are never bundled into wxcn registry items; the CLI installs the consumer's native primitives.
