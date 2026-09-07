<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import * as Card from '../ui/card/index.js';
	import ForecastScreens from './ForecastScreens.svelte';
	import { forecastDays, type ForecastDay } from '@wxcn/core/forecast-days.js';
	import ForecastIcon from '../../icons/forecast-icons.svelte';
	import WeatherShaderBackground, {
		type WeatherShaderMode
	} from './WeatherShaderBackground.svelte';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		WeatherPeriod,
		CurrentWeather,
		WeatherUnit
	} from '@wxcn/core/types.js';
	import { sampleWeather, sampleCurrentWeather, convertWindSpeed } from '@wxcn/core/weather.js';
	import { weatherOutlook } from '@wxcn/core/weather-outlook.js';
	let {
		interactive = false,
		timeZone,
		type = 'summary',
		size = 'default',
		density = 'comfortable',
		class: className = '',
		unit = 'fahrenheit',
		iconType,
		location = {
			label: 'Austin, TX',
			latitude: 30.2672,
			longitude: -97.7431,
			timeZone: 'America/Chicago'
		},
		forecast = sampleWeather,
		currentWeather = forecast === sampleWeather ? sampleCurrentWeather : null,
		showTemperatureTrend = false,
		showHighLow = false,
		at,
		sourceLabel = forecast === sampleWeather ? 'Sample forecast' : '',
		windUnit = 'mph',
		animatedBackground = false
	}: {
		interactive?: boolean;
		timeZone?: string;
		type?: ForecastType;
		size?: 'sm' | 'default' | 'lg';
		density?: 'compact' | 'comfortable';
		class?: string;
		unit?: WeatherUnit;
		iconType?: IconSet;
		location?: LocationInput;
		forecast?: WeatherPeriod[];
		currentWeather?: CurrentWeather | null;
		showTemperatureTrend?: boolean;
		showHighLow?: boolean;
		at?: number;
		sourceLabel?: string;
		windUnit?: 'mph' | 'km/h' | 'm/s' | 'knots';
		animatedBackground?: boolean;
	} = $props();
	let visitorTimeZone = $state('UTC');
	onMount(() => {
		visitorTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	});
	const displayTimeZone = $derived(timeZone ?? location.timeZone ?? visitorTimeZone);
	let clock = $state(Date.now());
	onMount(() => {
		const timer = setInterval(() => {
			clock = Date.now();
		}, 60000);
		return () => clearInterval(timer);
	});
	const effectiveTime = $derived(
		at ?? (forecast === sampleWeather ? Date.parse(sampleCurrentWeather.observedAt) : clock)
	);
	const current = $derived(currentWeather);
	const outlook = $derived(weatherOutlook(current, forecast, unit, displayTimeZone, effectiveTime));
	const periods = $derived(
		forecast.slice(0, type === 'detailed' ? 8 : density === 'compact' ? 3 : 5)
	);
	function temperature(p: WeatherPeriod) {
		return Math.round(
			unit === 'celsius' && p.temperatureUnit === 'F'
				? ((p.temperature - 32) * 5) / 9
				: unit === 'fahrenheit' && p.temperatureUnit === 'C'
					? (p.temperature * 9) / 5 + 32
					: p.temperature
		);
	}
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
	function icon(p: WeatherPeriod) {
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
	const days = $derived(
		forecastDays(
			forecast.map((p) => ({
				time: Date.parse(p.startTime),
				label: p.name,
				summary: `${temperature(p)}° · ${p.shortForecast}`,
				details: `${p.detailedForecast || p.shortForecast} Wind: ${p.windDirection} ${convertWindSpeed(p.windSpeed, windUnit)}.`
			})),
			displayTimeZone
		)
	);

	function dayPeriods(day: ForecastDay) {
		return forecast
			.filter((period) => day.entries.some((entry) => entry.time === Date.parse(period.startTime)))
			.toSorted((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
	}
	function heroPeriod(day: ForecastDay) {
		const values = dayPeriods(day);
		return values.find((period) => period.isDaytime) ?? values[0];
	}
</script>

{#snippet cardView(
	day: ForecastDay | undefined,
	action: Snippet<[boolean]>,
	overviewVisible: boolean,
	openDay: (time: string, trigger: HTMLElement) => void
)}
	{@const view = day ? heroPeriod(day) : current}
	{@const displayedPeriods = day ? dayPeriods(day) : periods}
	<div
		class={`relative isolate overflow-hidden ${animatedBackground && view ? 'text-white' : 'text-card-foreground'}`}
	>
		{#if animatedBackground && view}
			<div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
				<WeatherShaderBackground mode={condition(view)} paused={!overviewVisible} />
			</div>
			<div
				class="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-black/35 via-black/15 to-black/55"
				aria-hidden="true"
			></div>
		{/if}
		<Card.Header class="relative pt-(--card-spacing)">
			<Card.Title>{day?.label ?? 'Weather'}</Card.Title>
			<Card.Description class={animatedBackground && view ? 'text-white/80' : ''}
				>{location.label ?? 'Local forecast'}</Card.Description
			>
			{@render action(animatedBackground && !!view)}
		</Card.Header>
		<Card.Content class="relative grid gap-5 py-(--card-spacing)">
			{#if view}
				<div>
					<p
						class={`mb-2 text-xs ${animatedBackground ? 'text-white/75' : 'text-muted-foreground'}`}
					>
						{day ? (view.isDaytime ? 'Daytime' : 'Overnight') : 'Now'}
					</p>
					<p
						style="font-size:clamp(2.5rem,18cqw,5rem)"
						class="leading-none font-medium tracking-tighter tabular-nums"
					>
						{temperature(view)}<span class="align-top text-2xl">°</span>
					</p>
					<p
						class={`mt-3 text-sm ${day ? 'truncate' : ''}`}
						title={day ? view.shortForecast : undefined}
					>
						{view.shortForecast}
					</p>
					{#if !day && showTemperatureTrend && outlook.trend}<p
							class="mt-2 text-sm"
							data-slot="temperature-trend"
						>
							{outlook.trend}
						</p>{/if}
					{#if !day && showHighLow}<div
							class="mt-3 flex gap-4 text-sm tabular-nums"
							data-slot="temperature-range"
						>
							{#if outlook.high !== null}<span aria-label={`High ${outlook.high} degrees`}
									><ForecastIcon name="arrowUp" iconSet={iconType} class="inline size-3.5" />
									{outlook.high}°</span
								>{/if}
							{#if outlook.low !== null}<span aria-label={`Low ${outlook.low} degrees`}
									><ForecastIcon name="arrowDown" iconSet={iconType} class="inline size-3.5" />
									{outlook.low}°</span
								>{/if}
						</div>{/if}
				</div>
				<div class="flex flex-wrap items-center justify-between gap-3 text-xs">
					<span class="flex items-center gap-2 opacity-80"
						><ForecastIcon name="wind" iconSet={iconType} class="size-4" />Wind</span
					>
					<span class="tabular-nums"
						>{view.windDirection} {convertWindSpeed(view.windSpeed, windUnit)}</span
					>
				</div>
			{:else}<p role="status" class="py-8 text-center text-sm text-muted-foreground">
					Current conditions unavailable.
				</p>{/if}
			{#if type === 'simple' && sourceLabel}<p
					class={`text-[10px] ${animatedBackground && view ? 'text-white/70' : 'text-muted-foreground'}`}
				>
					{sourceLabel}
				</p>{/if}
		</Card.Content>
	</div>
	{#if type !== 'simple'}
		<Card.Content class="pb-(--card-spacing)">
			{#if displayedPeriods.length}
				<div class="divide-y">
					{#each displayedPeriods as period, index (`${period.startTime}-${index}`)}
						<div
							class={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm ${density === 'compact' ? 'py-2' : 'py-3'}`}
						>
							<div>
								{#if interactive && !day}<button
										type="button"
										class="min-h-8 text-left underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
										aria-label={`View details for ${period.name}`}
										onclick={(event) => openDay(period.startTime, event.currentTarget)}
										>{period.name}</button
									>{:else}<p>{period.name}</p>{/if}
								{#if type === 'detailed' || (day && size !== 'sm')}<p
										class="mt-1 text-xs leading-5 text-muted-foreground"
									>
										{type === 'detailed' ? period.detailedForecast : period.shortForecast}
									</p>{/if}
							</div>
							<ForecastIcon
								name={icon(period)}
								iconSet={iconType}
								class="size-4 text-muted-foreground"
							/>
							<span class="min-w-9 text-right tabular-nums">{temperature(period)}°</span>
						</div>
					{/each}
				</div>
			{/if}
			{#if sourceLabel}<p class="mt-2 text-[10px] text-muted-foreground">{sourceLabel}</p>{/if}
		</Card.Content>
	{/if}
{/snippet}

<Card.Root
	style="container-type: inline-size"
	size={size === 'sm' ? 'sm' : 'default'}
	data-density={density}
	data-card-size={size}
	class={`relative isolate min-w-0 gap-0 overflow-hidden py-0 ${className}`}
>
	<ForecastScreens
		{interactive}
		{days}
		title="Weather"
		{density}
		{sourceLabel}
		{iconType}
		showWeek={size === 'sm' || type === 'simple'}
		flush
	>
		{#snippet children(openDay, action, visible)}
			{@render cardView(undefined, action, visible, openDay)}
		{/snippet}
		{#snippet detail(day, action)}
			{@render cardView(day, action, true, () => {})}
		{/snippet}
	</ForecastScreens>
</Card.Root>
