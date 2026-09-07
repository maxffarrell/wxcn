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
	} from '@wxcn/core/types.js';

	let {
		timeZone,
		type = 'summary',
		size = 'default',
		density = 'comfortable',
		weatherUnit = 'fahrenheit',
		windUnit = 'mph',
		tideUnit = 'ft',
		iconType,
		animatedWeatherBackground = false,
		showTemperatureTrend = false,
		showHighLow = false,
		currentWeather,
		tideLocation,
		location = {
			label: 'Austin, TX',
			latitude: 30.2672,
			longitude: -97.7431,
			timeZone: 'America/Chicago'
		}
	}: {
		timeZone?: string;
		type?: ForecastType;
		size?: 'sm' | 'default' | 'lg';
		density?: 'compact' | 'comfortable';
		weatherUnit?: WeatherUnit;
		windUnit?: 'mph' | 'km/h' | 'm/s' | 'knots';
		tideUnit?: TideUnit;
		iconType?: IconSet;
		animatedWeatherBackground?: boolean;
		showTemperatureTrend?: boolean;
		showHighLow?: boolean;
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
				{timeZone}
				{type}
				{size}
				{density}
				unit={weatherUnit}
				{windUnit}
				{iconType}
				{location}
				animatedBackground={animatedWeatherBackground}
				{showTemperatureTrend}
				{showHighLow}
				{currentWeather}
			/>
		</div>
		<TideForecast
			{timeZone}
			{type}
			{size}
			{density}
			unit={tideUnit}
			{iconType}
			location={tideLocation}
		/>
		<MoonForecast {timeZone} {type} {size} {density} {iconType} {location} />
	</div>
</div>
