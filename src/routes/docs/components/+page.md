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

`wxcn-svelte` ships registry-ready cards for forecast interfaces. The shared props are:

- `type`: `summary`, `detailed`, or `simple`
- `iconType`: `hugeicons`, `phosphor-svelte`, `lucide`, `tabler`, or `remix`
- `location`: `{ label, latitude, longitude, station }`
- `unit`: `WeatherForecast` supports `fahrenheit` or `celsius`; `TideForecast` supports `ft` or `meter`
- `animatedBackground`: `WeatherForecast` only, renders a WebGL shader background from current conditions

<ExampleViewer code={overviewExample}>
	<ForecastDashboard type="summary" iconType="lucide" />
</ExampleViewer>

## WeatherForecast

Uses NWS `api.weather.gov` data. Pass `forecast` if you already load data server-side, or use `fetchWeatherForecast(location)`.
The animated background maps the Apple Weather icon conditions: sunrise, sunset, clear, partly cloudy, haze, fog, windy, cloudy, thunderstorm, rain, heavy rain, drizzle, snow, heavy snow, wintry mix, clear night, partly cloudy night, and drizzle night.

<ExampleViewer code={weatherExample}>
	<WeatherForecast type="summary" unit="celsius" iconType="hugeicons" animatedBackground />
</ExampleViewer>

## TideForecast

Uses NOAA CO-OPS predictions. Pass a `location.station` value for live lookups.

<ExampleViewer code={tideExample}>
	<TideForecast type="summary" unit="meter" iconType="tabler" />
</ExampleViewer>

## MoonForecast

Uses a local lunar cycle calculation for commercial-safe deployments without a hosted moon API.

<ExampleViewer code={moonExample}>
	<MoonForecast type="summary" iconType="remix" />
</ExampleViewer>
