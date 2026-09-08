<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { forecastDayNoon, forecastDays, type ForecastDay } from '@wxcn/core/forecast-days.js';
import { sampleWeather, sampleCurrentWeather, convertWindSpeed } from '@wxcn/core/weather.js';
import { weatherDayHigh, weatherOutlook } from '@wxcn/core/weather-outlook.js';
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
	rawCurrent = computed(() =>
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
	sky = computed(() => getSkyState(props.location.latitude, props.location.longitude, now.value)),
	current = computed(() =>
		rawCurrent.value
			? { ...rawCurrent.value, isDaytime: sky.value?.isDaytime ?? rawCurrent.value.isDaytime }
			: rawCurrent.value
	);
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
function heroPeriod(d: ForecastDay) {
	const values = dayPeriods(d);
	return values.find((p) => p.isDaytime) ?? values[0];
}
function representative(d: ForecastDay) {
	const values = dayPeriods(d);
	return values.find((p) => p.isDaytime) ?? values.find((p) => !p.isDaytime);
}
function dayHigh(d: ForecastDay) {
	return weatherDayHigh(d.key, dayPeriods(d), current.value, props.unit, zone.value);
}
import { defineComponent, h } from 'vue';
const WeatherView = defineComponent({
	props: { day: Object, openDay: Function, visible: Boolean, action: Function },
	setup(p) {
		return () => {
			const day = p.day as ForecastDay | undefined,
				shown = day ? dayPeriods(day) : periods.value,
				view = day ? heroPeriod(day) : current.value,
				hours = day ? dayHours(day) : [],
				viewSky =
					day && view
						? getSkyState(
								props.location.latitude,
								props.location.longitude,
								forecastDayNoon(day.key, zone.value)
							)
						: sky.value,
				skyMode = view
					? condition(day && viewSky ? { ...view, isDaytime: viewSky.isDaytime } : view)
					: 'clear';
			return [
				h(
					'div',
					{
						class: [
							day ? 'contents' : 'relative isolate overflow-hidden',
							props.background === 'realistic' && view ? 'text-white' : 'text-card-foreground'
						]
					},
					[
						props.background === 'realistic' && view
							? [
									h(
										'div',
										{ class: 'pointer-events-none absolute inset-0 -z-10', 'aria-hidden': 'true' },
										[
											h(WeatherShaderBackground, {
												mode: skyMode,
												sky: viewSky,
												paused: !p.visible
											})
										]
									),
									h('div', {
										class:
											'pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-black/35 via-black/15 to-black/55',
										'aria-hidden': 'true'
									})
								]
							: null,
						h(
							CardHeader,
							{
								class: 'relative pt-(--card-spacing)'
							},
							{
								default: () => [
									h(
										CardTitle,
										{ class: 'min-w-0 truncate' },
										{ default: () => day?.label ?? 'Weather' }
									),
									h(
										CardDescription,
										{
											class: [
												'truncate',
												props.background === 'realistic' && view ? 'text-white/80' : ''
											]
										},
										{ default: () => props.location.label ?? 'Local forecast' }
									),
									p.action?.()
								]
							}
						),
						h(
							CardContent,
							{ class: 'relative grid min-w-0 shrink-0 grid-cols-1 gap-5 py-(--card-spacing)' },
							{
								default: () =>
									view
										? [
												h('div', { class: 'min-w-0' }, [
													h(
														'p',
														{
															class: [
																'mb-2 text-xs',
																props.background === 'realistic'
																	? 'text-white/75'
																	: 'text-muted-foreground'
															]
														},
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
													h(
														'p',
														{
															class: 'mt-3 line-clamp-2 min-h-10 text-sm wrap-break-word',
															title: day ? view.shortForecast : undefined
														},
														view.shortForecast
													),
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
																				[
																					h(ForecastIcon, {
																						name: 'arrowUp',
																						iconSet: props.iconType,
																						class: 'inline size-3.5'
																					}),
																					` ${outlook.value.high}°`
																				]
																			)
																		: null,
																	outlook.value.low !== null
																		? h(
																				'span',
																				{ 'aria-label': `Low ${outlook.value.low} degrees` },
																				[
																					h(ForecastIcon, {
																						name: 'arrowDown',
																						iconSet: props.iconType,
																						class: 'inline size-3.5'
																					}),
																					` ${outlook.value.low}°`
																				]
																			)
																		: null
																]
															)
														: null
												]),
												h(
													'div',
													{ class: 'flex flex-wrap items-center justify-between gap-3 text-xs' },
													[
														h('span', { class: 'flex items-center gap-2 opacity-80' }, [
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
													]
												),
												!day && props.type === 'simple' && source.value
													? h(
															'p',
															{
																class: [
																	'text-[10px]',
																	props.background === 'realistic' && view
																		? 'text-white/70'
																		: 'text-muted-foreground'
																]
															},
															source.value
														)
													: null
											]
										: h('p', { role: 'status' }, 'Current conditions unavailable.')
							}
						)
					]
				),
				day && props.size === 'lg' && props.type !== 'simple' && hours.length
					? h(
							CardContent,
							{ class: 'relative flex min-h-0 flex-1 flex-col pb-[var(--wxcn-spacing)]' },
							{
								default: () => [
									h('p', { class: 'mb-3 shrink-0 text-base font-medium' }, 'Hourly forecast'),
									h(
										'div',
										{
											class: 'min-h-0 flex-1 overflow-y-auto overscroll-contain',
											tabindex: 0,
											role: 'region',
											'aria-label': 'Hourly forecast',
											'data-slot': 'hourly-forecast'
										},
										h(
											'div',
											{ class: 'grid min-h-full auto-rows-[minmax(3.5rem,1fr)] grid-cols-1' },
											hours.map((hour) =>
												h(
													'div',
													{
														class:
															'grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-current/15 text-lg last:border-0',
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
															class: 'size-6 shrink-0'
														}),
														h(
															'span',
															{ class: 'text-right font-medium tabular-nums' },
															`${temp(hour)}°`
														)
													]
												)
											)
										)
									)
								]
							}
						)
					: props.type !== 'simple'
						? h(
								CardContent,
								{ class: 'relative min-h-0 min-w-0 pb-(--card-spacing)' },
								{
									default: () => [
										h(
											'div',
											{ class: 'divide-y' },
											shown.map((x) =>
												h(
													'div',
													{
														class: `grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm ${props.density === 'compact' ? 'py-2' : 'py-3'}`
													},
													[
														h('div', null, [
															props.interactive && !day
																? h(
																		'button',
																		{
																			type: 'button',
																			class:
																				'min-h-8 text-left underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring',
																			'aria-label': `View details for ${x.name}`,
																			onClick: (e: MouseEvent) =>
																				p.openDay?.(x.startTime, e.currentTarget)
																		},
																		x.name
																	)
																: h('p', null, x.name),
															props.type === 'detailed' || (day && props.size !== 'sm')
																? h(
																		'p',
																		{
																			class: [
																				'mt-1 text-xs leading-5',
																				day && 'line-clamp-2',
																				day && props.background === 'realistic'
																					? 'text-white/75'
																					: 'text-muted-foreground'
																			]
																		},
																		props.type === 'detailed' ? x.detailedForecast : x.shortForecast
																	)
																: null
														]),
														h(ForecastIcon, {
															name: icon(x),
															...(props.iconType ? { iconSet: props.iconType } : {}),
															class: `size-4 ${day && props.background === 'realistic' ? 'text-white/75' : 'text-muted-foreground'}`
														}),
														h('span', { class: 'min-w-9 text-right tabular-nums' }, `${temp(x)}°`)
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
			:on-surface="background === 'realistic'"
			flush
			has-day-summary
		>
			<template #overview="{ openDay, visible, action }"
				><WeatherView :open-day="openDay" :visible="visible" :action="action"
			/></template>
			<template #detail="{ day, action }">
				<div
					:class="[
						'relative isolate flex h-full min-h-0 w-full min-w-0 flex-col',
						background === 'realistic' && 'text-white'
					]"
				>
					<WeatherView :day="day" :open-day="() => {}" visible :action="action" />
				</div>
			</template>
			<template #day-summary="{ day }">
				<span
					class="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_1.5em_3.75em_3.75em] items-center gap-2"
				>
					<span class="truncate font-medium">{{ day.label }}</span>
					<span
						v-if="representative(day)"
						class="flex justify-center"
						:title="representative(day)!.shortForecast"
						:aria-label="representative(day)!.shortForecast"
					>
						<ForecastIcon
							:name="icon(representative(day)!)"
							:icon-set="iconType"
							class="size-[1.4em] text-muted-foreground"
						/>
					</span>
					<span v-else></span>
					<span
						class="grid grid-cols-[0.85em_minmax(0,1fr)] items-center gap-1 text-right tabular-nums"
						:aria-label="
							dayHigh(day) !== null ? `High ${dayHigh(day)} degrees` : 'High unavailable'
						"
					>
						<ForecastIcon
							name="arrowUp"
							:icon-set="iconType"
							class="size-[1em] text-muted-foreground"
						/>
						<span>{{ dayHigh(day) !== null ? `${dayHigh(day)}°` : '—' }}</span>
					</span>
					<span
						class="grid grid-cols-[0.85em_minmax(0,1fr)] items-center gap-1 text-right text-muted-foreground tabular-nums"
						:aria-label="
							dayPeriods(day).find((p) => !p.isDaytime)
								? `Low ${temp(dayPeriods(day).find((p) => !p.isDaytime)!)} degrees`
								: 'Low unavailable'
						"
					>
						<ForecastIcon name="arrowDown" :icon-set="iconType" class="size-[1em]" />
						<span>{{
							dayPeriods(day).find((p) => !p.isDaytime)
								? `${temp(dayPeriods(day).find((p) => !p.isDaytime)!)}°`
								: '—'
						}}</span>
					</span>
				</span>
			</template>
		</ForecastScreens>
	</Card>
</template>
