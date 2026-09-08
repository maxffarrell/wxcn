<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { forecastDays, type ForecastDay } from '@wxcn/core/forecast-days.js';
import { sampleWeather, sampleCurrentWeather, convertWindSpeed } from '@wxcn/core/weather.js';
import { weatherOutlook } from '@wxcn/core/weather-outlook.js';
import { getSkyState } from '@wxcn/core/sky.js';
import type {
	ForecastType,
	LocationInput,
	WeatherPeriod,
	CurrentWeather,
	WeatherUnit,
	WeatherBackground
} from '@wxcn/core/types.js';
import type { IconSet, IconName } from '../../icons/ForecastIcon.vue';
import ForecastIcon from '../../icons/ForecastIcon.vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import ForecastScreens from './ForecastScreens.vue';
import WeatherGradientBackground from './WeatherGradientBackground.vue';
import WeatherShaderBackground, { type WeatherShaderMode } from './WeatherShaderBackground.vue';
const props = withDefaults(
	defineProps<{
		interactive?: boolean;
		iconType?: IconSet;
		timeZone?: string;
		type?: ForecastType;
		size?: 'sm' | 'default' | 'lg';
		density?: 'compact' | 'comfortable';
		class?: string;
		unit?: WeatherUnit;
		location?: LocationInput;
		forecast?: WeatherPeriod[];
		hourlyForecast?: WeatherPeriod[];
		currentWeather?: CurrentWeather | null;
		showTemperatureTrend?: boolean;
		showHighLow?: boolean;
		at?: number;
		sourceLabel?: string;
		windUnit?: 'mph' | 'km/h' | 'm/s' | 'knots';
		background?: WeatherBackground;
	}>(),
	{
		interactive: false,
		type: 'summary',
		size: 'default',
		density: 'comfortable',
		unit: 'fahrenheit',
		location: () => ({
			label: 'Austin, TX',
			latitude: 30.2672,
			longitude: -97.7431,
			timeZone: 'America/Chicago'
		}),
		forecast: () => sampleWeather,
		hourlyForecast: () => [],
		showTemperatureTrend: false,
		showHighLow: false,
		windUnit: 'mph',
		background: 'none'
	}
);
const visitor = ref('UTC'),
	clock = ref<number | null>(null);
let timer: number | undefined;
onMounted(() => {
	visitor.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
	clock.value = Date.now();
	timer = window.setInterval(() => (clock.value = Date.now()), 6e4);
});
onBeforeUnmount(() => clearInterval(timer));
const zone = computed(() => props.timeZone ?? props.location.timeZone ?? visitor.value),
	current = computed(() =>
		props.currentWeather === undefined
			? props.forecast === sampleWeather
				? sampleCurrentWeather
				: null
			: props.currentWeather
	),
	source = computed(
		() => props.sourceLabel ?? (props.forecast === sampleWeather ? 'Sample forecast' : '')
	),
	now = computed(
		() =>
			props.at ??
			(props.forecast === sampleWeather
				? Date.parse(sampleCurrentWeather.observedAt)
				: (clock.value ?? 0))
	),
	sky = computed(() => getSkyState(props.location.latitude, props.location.longitude, now.value));
const temp = (p: WeatherPeriod) =>
	Math.round(
		props.unit === 'celsius' && p.temperatureUnit === 'F'
			? ((p.temperature - 32) * 5) / 9
			: props.unit === 'fahrenheit' && p.temperatureUnit === 'C'
				? (p.temperature * 9) / 5 + 32
				: p.temperature
	);
const days = computed(() =>
	forecastDays(
		props.forecast.map((p) => ({
			time: Date.parse(p.startTime),
			label: p.name,
			summary: `${temp(p)}° · ${p.shortForecast}`,
			details: `${p.detailedForecast || p.shortForecast} Wind: ${p.windDirection} ${convertWindSpeed(p.windSpeed, props.windUnit)}.`
		})),
		zone.value
	)
);
const periods = computed(() =>
	props.forecast.slice(0, props.type === 'detailed' ? 8 : props.density === 'compact' ? 3 : 5)
);
const outlook = computed(() =>
	weatherOutlook(current.value, props.forecast, props.unit, zone.value, now.value)
);
function condition(p: WeatherPeriod): WeatherShaderMode {
	const s = p.shortForecast.toLowerCase();
	if (/thunder|storm/.test(s)) return 'thunderstorm';
	if (/sleet|freezing|wintry/.test(s)) return 'wintry-mix';
	if (/snow/.test(s)) return s.includes('heavy') ? 'heavy-snow' : 'snow';
	if (/drizzle/.test(s)) return p.isDaytime ? 'drizzle' : 'drizzle-night';
	if (/rain|shower/.test(s)) return s.includes('heavy') ? 'heavy-rain' : 'rain';
	if (/fog/.test(s)) return 'fog';
	if (/haze|smoke/.test(s)) return 'haze';
	if (/partly|mostly sunny/.test(s)) return p.isDaytime ? 'partly-cloudy' : 'partly-cloudy-night';
	if (/cloud|overcast/.test(s)) return 'cloudy';
	if (/wind|breezy/.test(s)) return 'wind';
	return p.isDaytime ? 'clear' : 'clear-night';
}
function icon(p: WeatherPeriod): IconName {
	const c = condition(p);
	return c.includes('rain') || c.includes('drizzle') || c === 'thunderstorm'
		? 'rain'
		: c.includes('snow') || c === 'wintry-mix'
			? 'snow'
			: c.includes('night')
				? 'moon'
				: c === 'clear'
					? 'sun'
					: 'weather';
}
function dayPeriods(d: ForecastDay) {
	return props.forecast
		.filter((p) => d.entries.some((e) => e.time === Date.parse(p.startTime)))
		.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}
function dayHours(d: ForecastDay) {
	const key = new Intl.DateTimeFormat('en-CA', {
		timeZone: zone.value,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
	return props.hourlyForecast
		.filter((p) => key.format(new Date(p.startTime)) === d.key)
		.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}
import { defineComponent, h } from 'vue';
const WeatherView = defineComponent({
	props: { day: Object, openDay: Function, visible: Boolean },
	setup(p) {
		return () => {
			const day = p.day as ForecastDay | undefined,
				shown = day ? dayPeriods(day) : periods.value,
				view = day ? (shown.find((x) => x.isDaytime) ?? shown[0]) : current.value,
				hours = day ? dayHours(day) : [],
				viewSky =
					day && view
						? getSkyState(
								props.location.latitude,
								props.location.longitude,
								Date.parse(view.startTime)
							)
						: sky.value;
			return [
				h('div', { class: 'relative isolate overflow-hidden' }, [
					props.background !== 'none' && view
						? h('div', { class: 'pointer-events-none absolute inset-0 -z-10' }, [
								props.background === 'gradient'
									? h(WeatherGradientBackground, { mode: condition(view), sky: viewSky })
									: h(WeatherShaderBackground, {
											mode: condition(view),
											sky: viewSky,
											paused: !p.visible,
											dithered: props.background === 'dithered'
										})
												]),
											!day && props.type === 'simple' && source.value
												? h('p', { class: 'mt-2 text-[10px] text-muted-foreground' }, source.value)
												: null
						: null,
					h(
						CardHeader,
						{
							class:
								'relative px-[var(--card-spacing,var(--wxcn-spacing))] pt-[var(--card-spacing,var(--wxcn-spacing))]'
						},
						{
							default: () => [
								h(CardTitle, null, { default: () => day?.label ?? 'Weather' }),
								h(
									CardDescription,
									{ class: props.background !== 'none' ? 'text-white/80' : '' },
									{ default: () => props.location.label ?? 'Local forecast' }
								)
							]
						}
					),
					h(
						CardContent,
						{ class: 'relative grid gap-5 py-[var(--wxcn-spacing)]' },
						{
							default: () =>
								view
									? [
											h('div', null, [
												h(
													'p',
													{ class: 'mb-2 text-xs opacity-75' },
													day ? (view.isDaytime ? 'Daytime' : 'Overnight') : 'Now'
												),
												h(
													'p',
													{
														style: { fontSize: 'clamp(2.5rem,18cqw,5rem)' },
														class: 'leading-none font-medium tracking-tighter tabular-nums'
													},
													[`${temp(view)}`, h('span', { class: 'align-top text-2xl' }, '°')]
												),
												h('p', { class: 'mt-3 text-sm' }, view.shortForecast),
												!day && props.showTemperatureTrend && outlook.value.trend
													? h(
															'p',
															{ class: 'mt-2 text-sm', 'data-slot': 'temperature-trend' },
															outlook.value.trend
														)
													: null,
												!day &&
												props.showHighLow &&
												(outlook.value.high !== null || outlook.value.low !== null)
													? h(
															'div',
															{
																class: 'mt-3 flex gap-4 text-sm tabular-nums',
																'data-slot': 'temperature-range'
															},
															[
																outlook.value.high !== null
																	? h(
																			'span',
																			{ 'aria-label': `High ${outlook.value.high} degrees` },
																			`↑ ${outlook.value.high}°`
																		)
																	: null,
																outlook.value.low !== null
																	? h(
																			'span',
																			{ 'aria-label': `Low ${outlook.value.low} degrees` },
																			`↓ ${outlook.value.low}°`
																		)
																	: null
															]
														)
													: null
											]),
											h('div', { class: 'flex justify-between text-xs' }, [
												h('span', { class: 'flex gap-2' }, [
													h(ForecastIcon, {
														name: 'wind',
														iconSet: props.iconType,
														class: 'size-4'
													}),
													'Wind'
												]),
												h(
													'span',
													null,
													`${view.windDirection} ${convertWindSpeed(view.windSpeed, props.windUnit)}`
												)
											])
										]
									: h('p', { role: 'status' }, 'Current conditions unavailable.')
						}
					)
				]),
				day && props.size === 'lg' && props.type !== 'simple' && hours.length
					? h(
							CardContent,
							{ class: 'relative min-h-0 flex-1 pb-[var(--wxcn-spacing)]' },
							{
								default: () => [
									h('p', { class: 'mb-3 text-xs font-medium' }, 'Hourly forecast'),
									h(
										'div',
										{ class: 'grid grid-cols-3 gap-x-4 gap-y-2', 'data-slot': 'hourly-forecast' },
										hours.map((hour) =>
											h(
												'div',
												{
													class: 'flex min-w-0 items-center justify-between gap-1 text-xs',
													title: hour.shortForecast
												},
												[
													h(
														'span',
														{ class: 'opacity-75' },
														new Intl.DateTimeFormat('en-US', {
															timeZone: zone.value,
															hour: 'numeric'
														}).format(new Date(hour.startTime))
													),
													h(ForecastIcon, {
														name: icon(hour),
														iconSet: props.iconType,
														class: 'size-3.5 shrink-0'
													}),
													h('span', { class: 'tabular-nums' }, `${temp(hour)}°`)
												]
											)
										)
									)
								]
							}
						)
					: props.type !== 'simple'
						? h(
								CardContent,
								{ class: 'pb-[var(--wxcn-spacing)]' },
								{
									default: () => [
										h(
											'div',
											{ class: 'divide-y' },
											shown.map((x) =>
												h(
													'div',
													{
														class:
															'grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-3 text-sm'
													},
													[
														props.interactive && !day
															? h(
																	'button',
																	{
																		type: 'button',
																		class: 'text-left hover:underline',
																		'aria-label': `View details for ${x.name}`,
																		onClick: (e: MouseEvent) =>
																			p.openDay?.(x.startTime, e.currentTarget)
																	},
																	x.name
																)
															: h('p', null, x.name),
														h(ForecastIcon, {
															name: icon(x),
															iconSet: props.iconType,
															class: 'size-4 text-muted-foreground'
														}),
														h('span', { class: 'tabular-nums' }, `${temp(x)}°`)
													]
												)
											)
										),
										!day && source.value
											? h('p', { class: 'mt-2 text-[10px] text-muted-foreground' }, source.value)
											: null
									]
								}
							)
						: null
			];
		};
	}
});
</script>
<template>
	<Card
		:style="{ containerType: 'inline-size', '--wxcn-spacing': size === 'sm' ? '1rem' : '1.5rem' }"
		:data-density="density"
		:data-card-size="size"
		:data-size="size === 'sm' ? 'sm' : 'default'"
		:class="['relative isolate min-w-0 gap-0 overflow-hidden py-0', props.class]"
	>
		<ForecastScreens
			:interactive="interactive"
			:days="days"
			title="Weather"
			:density="density"
			:source-label="source"
			:icon-type="iconType"
			:show-week="size === 'sm' || type === 'simple'"
			flush
			has-day-summary
		>
			<template #overview="{ openDay, visible }"
				><WeatherView :open-day="openDay" :visible="visible"
			/></template>
			<template #detail="{ day }"><WeatherView :day="day" :open-day="() => {}" visible /></template>
			<template #day-summary="{ day }">
				<span
					class="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_1.25rem_3rem_3rem] items-center gap-2"
				>
					<span class="truncate font-medium">{{ day.label }}</span>
					<ForecastIcon
						v-if="dayPeriods(day)[0]"
						:name="icon(dayPeriods(day)[0])"
						:icon-set="iconType"
						class="size-4 text-muted-foreground"
					/>
					<span>{{
						dayPeriods(day).find((p) => p.isDaytime)
							? `${temp(dayPeriods(day).find((p) => p.isDaytime)!)}°`
							: '—'
					}}</span>
					<span class="text-muted-foreground">{{
						dayPeriods(day).find((p) => !p.isDaytime)
							? `${temp(dayPeriods(day).find((p) => !p.isDaytime)!)}°`
							: '—'
					}}</span>
				</span>
			</template>
		</ForecastScreens>
	</Card>
</template>
