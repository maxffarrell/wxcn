<script>
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
</script>

# Components

`wxcn-svelte` ships registry-ready cards for forecast interfaces. Examples use deterministic Austin fixtures. Tides use Galveston Pier 21, since Austin is inland.

Install a card from `/r/weather-forecast.json`, `/r/moon-forecast.json`, or `/r/tide-forecast.json` using `shadcn-svelte add`. `/r/forecast-dashboard.json` installs the complete set. The registry resolves your existing base components, theme, aliases, and the icon library selected in `components.json`. No global wxcn stylesheet is needed.

The shared props are:

- `type`: `summary`, `detailed`, or `simple`
- `iconType`: live icon switching in the npm/demo version. Registry installs use your `components.json` icon library at installation time.
- `location`: `{ label, latitude, longitude, station }`
- `unit`: `WeatherForecast` supports `fahrenheit` or `celsius`; `TideForecast` supports `ft` or `meter`
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

Accepts NOAA CO-OPS predictions. Call `fetchTidePredictions(location)` and pass its result as `predictions` for live data. Set `sourceLabel` to describe your data. Times are local to the station; supplied heights are feet above MLLW.

<ExampleViewer code={tideExample}>
	<TideForecast type="summary" unit="meter" iconType="tabler" />
</ExampleViewer>

## MoonForecast

Uses a local mean lunar cycle estimate. Pass `getMoonForecast(date)` for another date. Full and new moon dates are approximate; rise and set times are not calculated.

<ExampleViewer code={moonExample}>
	<MoonForecast type="summary" iconType="remix" />
</ExampleViewer>
