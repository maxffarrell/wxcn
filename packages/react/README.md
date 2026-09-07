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

Props retain the Svelte meanings for size (`sm`, `default`, `lg`), density (`compact`, `comfortable`), detail (`simple`, `summary`, `detailed`), units, timezone, and provider data; use React `className`. Components use Lucide icons. Svelte icon sets and preset codes are not supported. Atmospheric backgrounds respect reduced motion and pause when hidden.

Defaults are fixtures, not live data. For live tides, provide `predictions`, `series`, `reading`, and a source label; `example={false}` disables sample interpolation. Missing or stale observations never appear as fresh observations. `at` accepts an explicit timestamp for server-rendered live data and tests. Without `at`, live data displays a stable loading state until the client clock is available. Provide an explicit `timeZone` for consistent server/client display.

Validation: `pnpm test:react`, `pnpm build:react`, `pnpm test:consumer:react`.
