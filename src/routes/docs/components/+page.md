<script>
 import PMBlock from "$lib/components/site/pm-block.svelte";
 import { page } from "$app/state";
	import ForecastDashboard from '$lib/components/wxcn/ForecastDashboard.svelte';
	import WeatherForecast from '$lib/components/wxcn/WeatherForecast.svelte';
	import TideForecast from '$lib/components/wxcn/TideForecast.svelte';
	import MoonForecast from '$lib/components/wxcn/MoonForecast.svelte';
	import ExampleViewer from '$lib/components/docs/ExampleViewer.svelte';
	import {
		overviewExample,
		weatherExample,
		tideExample,
		moonExample
	} from '$lib/docs/component-examples.js';
 const installCommand = $derived(['shadcn-svelte@latest', 'add', page.url.origin + '/r/forecast-dashboard.json']);
</script>

# Components

`wxcn` ships registry-ready cards for forecast interfaces. The homepage requests browser location and loads local NWS weather and nearby NOAA tide predictions. If location is declined or unavailable, the Austin example remains clearly labeled. These documentation previews use deterministic fixtures.

Install a card from `/r/weather-forecast.json`, `/r/moon-forecast.json`, or `/r/tide-forecast.json` using `shadcn-svelte add`. `/r/forecast-dashboard.json` installs the complete set. The registry resolves your existing base components, theme, aliases, and the icon library selected in `components.json`. No global wxcn stylesheet is needed.

<PMBlock type="execute" command={installCommand} />

Cards scale their typography to their container width. Drag the bottom-right resize handle in a component preview to test narrower layouts. The shared props are:

- `size`: `sm`, `default`, or `lg` — changes the visual scale and primitive sizing
- `density`: `compact` or `comfortable` — changes row spacing and summary data count
- `type`: `summary`, `detailed`, or `simple` — selects the amount of content
- `iconType`: live icon switching in the npm/demo version. Registry installs use your `components.json` icon library at installation time.
- `location`: `{ label, latitude, longitude, station }`
- `unit` (optional): `WeatherForecast` supports `fahrenheit` (default) or `celsius`; `TideForecast` supports `ft` (default) or `meter`
- `windUnit` (optional): `mph` (default), `km/h`, `m/s`, or `knots`. `ForecastDashboard` also accepts `weatherUnit`, `windUnit`, and `tideUnit`.
- `animatedBackground`: `WeatherForecast` only, renders a WebGL shader background from current conditions

<ExampleViewer code={overviewExample}>
	<ForecastDashboard type="summary" iconType="lucide" />
</ExampleViewer>

## WeatherForecast

Accepts NWS `api.weather.gov` periods. The default preview is sample data, not a live request. Pass `forecast` if you already load data server-side, or use `fetchWeatherForecast(location)`.
The optional background recognizes: sunrise, sunset, clear, partly cloudy, haze, fog, windy, cloudy, thunderstorm, rain, heavy rain, drizzle, snow, heavy snow, wintry mix, clear night, partly cloudy night, and drizzle night.

<ExampleViewer code={weatherExample}>
	<WeatherForecast type="summary" unit="celsius" iconType="hugeicons" animatedBackground />
</ExampleViewer>

## TideForecast

Accepts NOAA CO-OPS predictions. Call `fetchTidePredictions(location)` and pass its result as `predictions` for live data. Set `sourceLabel` to describe your data. Supply ISO timestamps with an explicit offset and `location.timeZone` for station-local labels; heights are feet above MLLW. Pass six-minute predictions as `series` and the latest observation as `reading` (`{ time, height }`). The LayerChart 2 curve marks the latest fresh reading, falls back to a labeled prediction, and shows the surrounding high/low events. Without continuous predictions, extrema alone do not produce a current reading.

<ExampleViewer code={tideExample}>
	<TideForecast type="summary" unit="meter" iconType="tabler" />
</ExampleViewer>

## MoonForecast

Uses a local mean lunar cycle estimate. Pass `getMoonForecast(date)` for another date. Full and new moon dates are approximate; rise and set times are not calculated.

<ExampleViewer code={moonExample}>
	<MoonForecast type="summary" iconType="remix" />
</ExampleViewer>
