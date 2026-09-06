<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ForecastIcon from '$lib/icons/forecast-icons.svelte';
	import WeatherShaderBackground, {
		type WeatherShaderMode
	} from './WeatherShaderBackground.svelte';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		WeatherPeriod,
		WeatherUnit
	} from '$lib/data/types.js';
	import { sampleWeather, convertWindSpeed } from '$lib/data/weather.js';
	let {
		type = 'summary',
		size = 'default',
		density = 'comfortable',
		class: className = '',
		unit = 'fahrenheit',
		iconType,
		location = { label: 'Austin, TX', latitude: 30.2672, longitude: -97.7431 },
		forecast = sampleWeather,
		sourceLabel = 'Sample forecast · Austin, TX',
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
		sourceLabel?: string;
		windUnit?: 'mph' | 'km/h' | 'm/s' | 'knots';
		animatedBackground?: boolean;
	} = $props();
	const current = $derived(forecast[0]);
	const periods = $derived(
		forecast.slice(1, type === 'detailed' ? 8 : density === 'compact' ? 3 : 5)
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
	class={`relative isolate min-w-0 overflow-hidden ${className}`}
>
	<Card.Header>
		<Card.Title>Weather</Card.Title>
		<Card.Description>{location.label ?? 'Local forecast'}</Card.Description>
		<Card.Action
			><ForecastIcon
				name="weather"
				iconSet={iconType}
				class="size-5 text-muted-foreground"
			/></Card.Action
		>
	</Card.Header>
	{#if current}
		<Card.Content class={density === 'compact' ? 'grid gap-3' : 'grid gap-6'}>
			<div
				class={`relative isolate overflow-hidden rounded-lg border bg-muted/20 ${size === 'sm' ? 'p-3' : size === 'lg' ? 'p-6' : 'p-5'}`}
			>
				{#if animatedBackground}<div
						class="pointer-events-none absolute inset-0 -z-10"
						aria-hidden="true"
					>
						<WeatherShaderBackground mode={condition(current)} />
					</div>{/if}
				{#if animatedBackground}<div
						class="pointer-events-none absolute inset-0 bg-linear-to-r from-black/55 via-black/25 to-black/10"
						aria-hidden="true"
					></div>{/if}
				<div
					class={`relative z-10 ${animatedBackground ? 'text-white [text-shadow:0_1px_5px_rgb(0_0_0/35%)]' : 'text-card-foreground'}`}
				>
					<p
						class={`mb-2 text-xs ${animatedBackground ? 'text-white/80' : 'text-muted-foreground'}`}
					>
						{current.name}
					</p>
					<p
						style="font-size:clamp(2rem,16cqw,4.5rem)"
						class={`font-medium tracking-tighter tabular-nums ${size === 'sm' ? 'text-4xl' : size === 'lg' ? 'text-7xl' : 'text-6xl'}`}
					>
						{temperature(current)}<span class="align-top text-3xl"
							>°{unit === 'celsius' ? 'C' : 'F'}</span
						>
					</p>
					<p class="mt-2 text-sm">{current.shortForecast}</p>
				</div>

				<div
					class={`relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3 text-xs ${animatedBackground ? 'text-white' : 'text-card-foreground'}`}
				>
					<span class="flex items-center gap-2 opacity-80"
						><ForecastIcon name="wind" iconSet={iconType} class="size-4" />Wind</span
					><span class="tabular-nums"
						>{current.windDirection} {convertWindSpeed(current.windSpeed, windUnit)}</span
					>
				</div>
			</div>
			{#if type !== 'simple'}
				<div class="divide-y border-t">
					{#each periods as period, index (`${period.startTime}-${index}`)}
						<div
							class={`grid grid-cols-[1fr_auto_auto] items-center gap-4 text-sm ${density === 'compact' ? 'py-2' : 'py-3'}`}
						>
							<div>
								<p>{period.name}</p>
								{#if type === 'detailed'}<p
										class="mt-1 max-w-72 text-xs leading-5 text-muted-foreground"
									>
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
		</Card.Content>
	{:else}
		<Card.Content
			><p role="status" class="py-8 text-center text-sm text-muted-foreground">
				No forecast available. Try again later.
			</p></Card.Content
		>
	{/if}
	<Card.Footer class="justify-between gap-3 border-t text-xs text-muted-foreground"
		><span>{sourceLabel}</span><Badge variant="outline">{unit === 'celsius' ? '°C' : '°F'}</Badge
		></Card.Footer
	>
</Card.Root>
