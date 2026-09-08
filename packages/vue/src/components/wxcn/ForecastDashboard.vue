<script setup lang="ts">
import type {
	ForecastType,
	LocationInput,
	TideUnit,
	WeatherUnit,
	CurrentWeather,
	WeatherBackground,
	WeatherPeriod
} from '@wxcn/core/types.js';
import type { IconSet } from '../../icons/ForecastIcon.vue';
import WeatherForecast from './WeatherForecast.vue';
import TideForecast from './TideForecast.vue';
import MoonForecast from './MoonForecast.vue';
withDefaults(
	defineProps<{
		interactive?: boolean;
		iconType?: IconSet;
		timeZone?: string;
		type?: ForecastType;
		size?: 'sm' | 'default' | 'lg';
		density?: 'compact' | 'comfortable';
		weatherUnit?: WeatherUnit;
		windUnit?: 'mph' | 'km/h' | 'm/s' | 'knots';
		tideUnit?: TideUnit;
		background?: WeatherBackground;
		showTemperatureTrend?: boolean;
		showHighLow?: boolean;
		currentWeather?: CurrentWeather | null;
		hourlyForecast?: WeatherPeriod[];
		location?: LocationInput;
		tideLocation?: LocationInput;
	}>(),
	{
		interactive: false,
		type: 'summary',
		size: 'default',
		density: 'comfortable',
		weatherUnit: 'fahrenheit',
		windUnit: 'mph',
		tideUnit: 'ft',
		background: 'none',
		showTemperatureTrend: false,
		showHighLow: false
	}
);
</script>
<template>
	<div class="@container/dashboard w-full">
		<div
			class="grid items-start gap-4 @min-[38rem]/dashboard:grid-cols-2 @min-[52rem]/dashboard:grid-cols-3"
		>
			<div class="min-w-0 @min-[38rem]/dashboard:col-span-2 @min-[52rem]/dashboard:col-span-1">
				<WeatherForecast
					:interactive="interactive"
					:icon-type="iconType"
					:time-zone="timeZone"
					:type="type"
					:size="size"
					:density="density"
					:unit="weatherUnit"
					:wind-unit="windUnit"
					:location="location"
					:background="background"
					:show-temperature-trend="showTemperatureTrend"
					:show-high-low="showHighLow"
					:current-weather="currentWeather"
					:hourly-forecast="hourlyForecast"
				/>
			</div>
			<TideForecast
				:interactive="interactive"
				:icon-type="iconType"
				:time-zone="timeZone"
				:type="type"
				:size="size"
				:density="density"
				:unit="tideUnit"
				:location="tideLocation"
			/><MoonForecast
				:interactive="interactive"
				:icon-type="iconType"
				:time-zone="timeZone"
				:type="type"
				:size="size"
				:density="density"
				:location="location"
			/>
		</div>
	</div>
</template>
