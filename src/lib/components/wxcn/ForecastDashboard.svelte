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
		location = {
			label: 'Austin, TX',
			latitude: 30.2672,
			longitude: -97.7431,
			station: '8665530'
		}
	}: {
		type?: ForecastType;
		weatherUnit?: WeatherUnit;
		tideUnit?: TideUnit;
		iconType?: IconSet;
		location?: LocationInput;
	} = $props();
</script>

<div class="grid gap-4 lg:grid-cols-3">
	<WeatherForecast {type} unit={weatherUnit} {iconType} {location} />
	<TideForecast {type} unit={tideUnit} {iconType} {location} />
	<MoonForecast {type} {iconType} {location} />
</div>
