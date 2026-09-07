---
name: wxcn
description: Install, compose, and contribute weather, moon, and tide cards from the wxcn registry. Use for wxcn component integration, data props, native shadcn theming, and framework contributions.
---

# wxcn

wxcn distributes editable component source through framework-specific shadcn registries. Svelte and React are implemented; Vue remains a contribution target.

## Installing and composing

Read `/llms.txt` on the project's deployed origin for the documentation index. Every public page accepts `Accept: text/markdown` or a `.md` suffix; the homepage is `/index.md`. `/docs/components.md` includes examples, CLI commands, and manual source files. Use the origin of the site you are working with rather than assuming a deployment URL.

Install `/r/svelte/<component>.json` with `shadcn-svelte@latest add <full-url>`, or `/r/react/<component>.json` with the shadcn CLI. The adapters apply the consumer's aliases, theme, base components, and configured icon library. React supports Lucide, Tabler, Phosphor, Hugeicons, and Remixicon. Use the consumer's package manager. In this repo's website, display install commands with PMBlock.

- Weather: pass `currentWeather` observations separately from `forecast` highs/lows. `showTemperatureTrend` and `showHighLow` are independent optional props. Supply the local-day observed `highToday` so the rise sentence stops after the high is reached. Set `location.timeZone` and the desired units. Missing observations should remain unavailable rather than using forecast highs as current readings.
- Tides: choose the nearest coastal station by default. Pass prediction series and readings; do not infer a current tide from high/low events alone. Charts use the native shadcn chart with LayerChart 2 in Svelte.
- Moon: phase calculations live in the shared core. Keep explanatory model details in the data-source docs.
- Omitted data renders fixtures. Identify fixtures when composing demos; do not describe them as live data.

The React implementation is documented at `/react` and `/react/docs/components`; `apps/preview-react` is a standalone Vite harness for native SSR, hydration, and interaction checks.

## Contributing

Read `CONTRIBUTING.md` and `tooling/contracts/README.md` in the repository before adding an implementation. Shared types and calculations live in `packages/core`; Svelte components in `packages/svelte`; the site in `apps/web`. Registry adapters live in `tooling/registry/adapters`.

Preserve native shadcn primitives, card spacing, theme tokens, selected icon sets, and exact preset compatibility. Regenerate registry JSON with `pnpm registry:build`; edit source rather than generated items. Keep Vue disabled until a native implementation, preview, and clean-consumer installation work. React registry output must include the generated native forecast icon helper and preserve the configured icon-library transform.

Use MDSX for documentation prose and the existing upstream component viewer, installation steps, and source viewer. Add public pages to the Markdown page catalog so agents can discover them. Keep heading IDs unique and stable.

Validate with `pnpm check`, `pnpm test`, `pnpm test:react`, `pnpm lint`, `pnpm build`, and `pnpm build:react`. Run `pnpm test:consumer` and `pnpm test:consumer:react` when registry contents or transforms change. Verify visual changes at desktop and mobile sizes.
