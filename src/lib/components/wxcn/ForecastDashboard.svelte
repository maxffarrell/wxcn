<script lang="ts">
	import WeatherForecast from './WeatherForecast.svelte';
	import TideForecast from './TideForecast.svelte';
	import MoonForecast from './MoonForecast.svelte';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		TideUnit,
		WeatherUnit
	} from '$lib/data/types.js';

	let {
		type = 'summary',
		weatherUnit = 'fahrenheit',
		tideUnit = 'ft',
		iconType = 'lucide',
		animatedWeatherBackground = false,
		location = {
			label: 'Santa Monica, CA',
			latitude: 34.0195,
			longitude: -118.4912,
			station: '9410840'
		}
	}: {
		type?: ForecastType;
		weatherUnit?: WeatherUnit;
		tideUnit?: TideUnit;
		iconType?: IconSet;
		animatedWeatherBackground?: boolean;
		location?: LocationInput;
	} = $props();
</script>

<div class="grid gap-4 lg:grid-cols-3">
	<WeatherForecast
		{type}
		unit={weatherUnit}
		{iconType}
		{location}
		animatedBackground={animatedWeatherBackground}
	/>
	<TideForecast {type} unit={tideUnit} {iconType} {location} />
	<MoonForecast {type} {iconType} />
</div>
