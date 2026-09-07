<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '../ui/card/index.js';
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
	const outlook = $derived(
		weatherOutlook(current, forecast, unit, location.timeZone ?? 'UTC', effectiveTime)
	);
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
</script>

<Card.Root
	style="container-type: inline-size"
	size={size === 'sm' ? 'sm' : 'default'}
	data-density={density}
	data-card-size={size}
	class={`relative isolate min-w-0 gap-0 overflow-hidden py-0 ${className}`}
>
	<div
		class={`relative isolate overflow-hidden ${animatedBackground && current ? 'text-white' : 'text-card-foreground'}`}
	>
		{#if animatedBackground && current}
			<div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
				<WeatherShaderBackground mode={condition(current)} />
			</div>
			<div
				class="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-black/35 via-black/15 to-black/55"
				aria-hidden="true"
			></div>
		{/if}
		<Card.Header class="relative pt-(--card-spacing)">
			<Card.Title>Weather</Card.Title>
			<Card.Description class={animatedBackground && current ? 'text-white/80' : ''}
				>{location.label ?? 'Local forecast'}</Card.Description
			>
		</Card.Header>
		<Card.Content class="relative grid gap-5 py-(--card-spacing)">
			{#if current}
				<div>
					<p
						class={`mb-2 text-xs ${animatedBackground ? 'text-white/75' : 'text-muted-foreground'}`}
					>
						Now
					</p>
					<p
						style="font-size:clamp(2.5rem,18cqw,5rem)"
						class="leading-none font-medium tracking-tighter tabular-nums"
					>
						{temperature(current)}<span class="align-top text-2xl"
							>°{unit === 'celsius' ? 'C' : 'F'}</span
						>
					</p>
					<p class="mt-3 text-sm">{current.shortForecast}</p>
					{#if showTemperatureTrend && outlook.trend}<p
							class="mt-2 text-sm"
							data-slot="temperature-trend"
						>
							{outlook.trend}
						</p>{/if}
					{#if showHighLow}<div
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
						>{current.windDirection} {convertWindSpeed(current.windSpeed, windUnit)}</span
					>
				</div>
			{:else}<p role="status" class="py-8 text-center text-sm text-muted-foreground">
					Current conditions unavailable.
				</p>{/if}
			{#if type === 'simple' && sourceLabel}<p
					class={`text-[10px] ${animatedBackground && current ? 'text-white/70' : 'text-muted-foreground'}`}
				>
					{sourceLabel}
				</p>{/if}
		</Card.Content>
	</div>
	{#if type !== 'simple'}
		<Card.Content class="pb-(--card-spacing)">
			{#if periods.length}
				<div class="divide-y">
					{#each periods as period, index (`${period.startTime}-${index}`)}
						<div
							class={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm ${density === 'compact' ? 'py-2' : 'py-3'}`}
						>
							<div>
								<p>{period.name}</p>
								{#if type === 'detailed'}<p class="mt-1 text-xs leading-5 text-muted-foreground">
										{period.detailedForecast}
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
</Card.Root>
