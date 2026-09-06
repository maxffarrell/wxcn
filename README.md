# wxcn-svelte

Weather, moon, and tide cards built with current shadcn-svelte primitives and Svelte 5. The demo uses Austin, Texas. Coastal tide fixtures use Galveston Pier 21; Austin has no coastal tide station.

## Development

```sh
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm lint
pnpm build
pnpm package
```

The toolchain uses Tailwind CSS 4 and the current Nova base components. TypeScript 6 is the latest major supported by SvelteKit, svelte-check, and svelte-package. The demo's `components.json` selects Nova and Lucide.

## Install from the registry

Start this site locally, then run this in an initialized shadcn-svelte project (replace the origin for your hosted registry):

```sh
pnpm dlx shadcn-svelte@latest add http://localhost:5173/r/weather-forecast.json
```

Other entries: `/r/moon-forecast.json`, `/r/tide-forecast.json`, and `/r/forecast-dashboard.json`. The dashboard installs all three cards.

The CLI resolves `card` and `badge` using the consumer's configuration. Registry files use native alias placeholders and `IconPlaceholder` mappings for Lucide, Tabler, Hugeicons, Phosphor, and Remix Icon. Only the selected icon library is installed. The icon selection is made **at installation time** from `components.json`; the site's live icon picker is a preview feature.

Cards use the consuming project's theme variables, primitive spacing, and radius. They do not install theme values, a font, site CSS, or replacement base components. Weather backgrounds and the moon illustration carry their own scoped styles. `pnpm registry:build` regenerates the catalog and all installable files from source. Run it before testing local installs; the production build runs it automatically.

## Data

Previews are deterministic sample data, not live readings. `WeatherForecast` accepts NWS `forecast` periods; `fetchWeatherForecast(location)` loads them. Pass an appropriate `sourceLabel` when replacing fixtures. Temperature conversion applies to every supplied period; the card does not fabricate hourly forecasts, air quality, humidity, or apparent temperature.

`TideForecast` accepts NOAA high/low predictions in feet, and displays feet or meters. `fetchTidePredictions` requests MLLW in local station time. The curve connects supplied extrema, not continuous water levels. `ForecastDashboard` keeps its coastal tide location separate from its Austin weather/moon location.

`getMoonForecast(date)` estimates lunar phase from the mean synodic month. It does not calculate moonrise, moonset, or direction. Its dates are approximate. The fixture uses September 6, 2026.

Optional animated backgrounds render a softly lit cloud layer and precipitation. They respect reduced motion, pause offscreen and in hidden tabs, cap pixel density and frame rate, and use a static gradient if WebGL is unavailable. Backgrounds never sit beneath unprotected forecast text.

## Source and license

MIT. Base components and Nova style rules are from [shadcn-svelte](https://github.com/huntabyte/shadcn-svelte). See `THIRD_PARTY_NOTICES.md`. The npm package export remains available; registry installation is the preferred path for inheriting a project's chosen base components and icon library.
