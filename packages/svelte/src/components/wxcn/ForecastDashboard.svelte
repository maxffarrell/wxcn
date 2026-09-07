<script lang="ts">
	import WeatherForecast from './WeatherForecast.svelte';
	import TideForecast from './TideForecast.svelte';
	import MoonForecast from './MoonForecast.svelte';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		TideUnit,
		WeatherUnit,
		WeatherBackground
	} from '@wxcn/core/types.js';

	let {
		interactive = false,
		timeZone,
		type = 'summary',
		size = 'default',
		density = 'comfortable',
		weatherUnit = 'fahrenheit',
		windUnit = 'mph',
		tideUnit = 'ft',
		iconType,
		background = 'none',
		showTemperatureTrend = false,
		showHighLow = false,
		currentWeather,
		hourlyForecast,
		tideLocation,
		location = {
			label: 'Austin, TX',
			latitude: 30.2672,
			longitude: -97.7431,
			timeZone: 'America/Chicago'
		}
	}: {
		interactive?: boolean;
		timeZone?: string;
		type?: ForecastType;
		size?: 'sm' | 'default' | 'lg';
		density?: 'compact' | 'comfortable';
		weatherUnit?: WeatherUnit;
		windUnit?: 'mph' | 'km/h' | 'm/s' | 'knots';
		tideUnit?: TideUnit;
		iconType?: IconSet;
		background?: WeatherBackground;
		showTemperatureTrend?: boolean;
		showHighLow?: boolean;
		hourlyForecast?: import('@wxcn/core/types.js').WeatherPeriod[];
		currentWeather?: import('@wxcn/core/types.js').CurrentWeather | null;
		location?: LocationInput;
		tideLocation?: LocationInput;
	} = $props();
</script>

<div class="@container/dashboard w-full">
	<div
		class="grid items-start gap-4 @min-[38rem]/dashboard:grid-cols-2 @min-[52rem]/dashboard:grid-cols-3"
	>
		<div class="min-w-0 @min-[38rem]/dashboard:col-span-2 @min-[52rem]/dashboard:col-span-1">
			<WeatherForecast
				{interactive}
				{timeZone}
				{type}
				{size}
				{density}
				unit={weatherUnit}
				{windUnit}
				{iconType}
				{location}
				{background}
				{showTemperatureTrend}
				{showHighLow}
				{currentWeather}
				{hourlyForecast}
			/>
		</div>
		<TideForecast
			{interactive}
			{timeZone}
			{type}
			{size}
			{density}
			unit={tideUnit}
			{iconType}
			location={tideLocation}
		/>
		<MoonForecast {interactive} {timeZone} {type} {size} {density} {iconType} {location} />
	</div>
</div>
