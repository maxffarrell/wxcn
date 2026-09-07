---
name: wxcn
description: Install, compose, and contribute weather, moon, and tide cards from the wxcn registry. Use for wxcn component integration, data props, native shadcn theming, and framework contributions.
---

# wxcn

wxcn distributes editable component source through framework-specific shadcn registries. Svelte is implemented; React and Vue are contribution targets, not installable implementations.

## Installing and composing

Read `/llms.txt` on the project's deployed origin for the documentation index. Every public page accepts `Accept: text/markdown` or a `.md` suffix; the homepage is `/index.md`. `/docs/components.md` includes examples, CLI commands, and manual source files. Use the origin of the site you are working with rather than assuming a deployment URL.

Install `/r/svelte/weather-forecast.json`, `moon-forecast.json`, `tide-forecast.json`, or `forecast-dashboard.json` with `shadcn-svelte@latest add <full-url>`. The CLI applies the consumer's aliases, theme, base components, and icon library. Use the consumer's package manager. In this repo's website, display install commands with PMBlock.

- Weather: pass `currentWeather` observations separately from `forecast` highs/lows. `showTemperatureTrend` and `showHighLow` are independent optional props. Supply the local-day observed `highToday` so the rise sentence stops after the high is reached. Set `location.timeZone` and the desired units. Missing observations should remain unavailable rather than using forecast highs as current readings.
- Tides: choose the nearest coastal station by default. Pass prediction series and readings; do not infer a current tide from high/low events alone. Charts use the native shadcn chart with LayerChart 2 in Svelte.
- Moon: phase calculations live in the shared core. Keep explanatory model details in the data-source docs.
- Omitted data renders fixtures. Identify fixtures when composing demos; do not describe them as live data.

## Contributing

Read `CONTRIBUTING.md` and `tooling/contracts/README.md` in the repository before adding an implementation. Shared types and calculations live in `packages/core`; Svelte components in `packages/svelte`; the site in `apps/web`. Registry adapters live in `tooling/registry/adapters`.

Preserve native shadcn primitives, card spacing, theme tokens, selected icon sets, and exact preset compatibility. Regenerate registry JSON with `pnpm registry:build`; edit source rather than generated items. Keep React/Vue disabled until a native implementation, preview, and clean-consumer installation work.

Use MDSX for documentation prose and the existing upstream component viewer, installation steps, and source viewer. Add public pages to the Markdown page catalog so agents can discover them. Keep heading IDs unique and stable.

Validate with `pnpm check`, `pnpm test`, `pnpm lint`, and `pnpm build`. Run `pnpm test:consumer` when registry contents or transforms change. Verify visual changes at desktop and mobile sizes.
