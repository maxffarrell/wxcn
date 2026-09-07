# @wxcn/react

Native React weather, tide, moon, and dashboard components built on shadcn/ui and Recharts. Preview at [wxcn.dev/react](https://wxcn.dev/react), or run `pnpm dev:react` from the workspace root.

```sh
npx shadcn@latest add https://wxcn.dev/r/react/forecast-dashboard.json
```

Individual items: `weather-forecast`, `tide-forecast`, and `moon-forecast` at the same registry base URL. Installation copies editable components and shared calculations into your project, uses your configured aliases, and installs native shadcn primitives. No workspace packages are needed by installed components. Requires React 19 and modern ES2023 APIs.

```tsx
import { WeatherForecast } from '@/components/wxcn/weather-forecast';

<WeatherForecast
	forecast={periods}
	currentWeather={observation}
	unit="celsius"
	sourceLabel="Your weather provider"
/>;
```

Props retain the Svelte meanings for `interactive`, size (`sm`, `default`, `lg`), density (`compact`, `comfortable`), detail (`simple`, `summary`, `detailed`), units, timezone, and provider data; use React `className`. Set `interactive` to enable week and day navigation; it defaults to `false`. The native icon adapter supports Lucide, Tabler, Phosphor, Hugeicons, and Remixicon using React-local icon names. Atmospheric backgrounds respect reduced motion and pause when hidden.

Defaults are fixtures, not live data. For live tides, provide `predictions`, `series`, `reading`, and a source label; `example={false}` disables sample interpolation. Missing or stale observations never appear as fresh observations. `at` accepts an explicit timestamp for server-rendered live data and tests. Without `at`, live data displays a stable loading state until the client clock is available. Display time zones use explicit `timeZone`, then `location.timeZone`, then the browser time zone after hydration; SSR falls back to UTC when neither prop supplies a time zone.

The standalone Vite preview in `apps/preview-react` is a validation harness; the same native React cards are rendered by the Astro site at `/react`, with component documentation at `/react/docs/components` and React registry endpoints at `/r/react/<component>.json`.

Validation: `pnpm test:react`, `pnpm build:react`, `pnpm test:consumer:react`.
