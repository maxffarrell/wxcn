<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ForecastIcon from '$lib/icons/forecast-icons.svelte';
	import WeatherShaderBackground from './WeatherShaderBackground.svelte';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		WeatherPeriod,
		WeatherUnit
	} from '$lib/data/types.js';
	import { sampleWeather } from '$lib/data/weather.js';

	let {
		type = 'summary',
		unit = 'fahrenheit',
		iconType = 'lucide',
		location = { label: 'Austin, TX', latitude: 30.2672, longitude: -97.7431 },
		forecast = sampleWeather,
		sourceLabel = 'NWS api.weather.gov',
		animatedBackground = false
	}: {
		type?: ForecastType;
		unit?: WeatherUnit;
		iconType?: IconSet;
		location?: LocationInput;
		forecast?: WeatherPeriod[];
		sourceLabel?: string;
		animatedBackground?: boolean;
	} = $props();

	function displayTemperature(value: number, sourceUnit: string) {
		const normalizedSource = sourceUnit.toUpperCase();
		if (unit === 'celsius' && normalizedSource === 'F')
			return Math.round(((value - 32) * 5) / 9);
		if (unit === 'fahrenheit' && normalizedSource === 'C')
			return Math.round((value * 9) / 5 + 32);
		return Math.round(value);
	}

	const periods = $derived(
		type === 'simple' ? forecast.slice(0, 1) : forecast.slice(0, 3)
	);
	const current = $derived(periods[0]);
	const displayUnitLabel = $derived(unit === 'celsius' ? 'C' : 'F');
	const currentTemperature = $derived(
		displayTemperature(current.temperature, current.temperatureUnit)
	);
	const apparentTemperature = $derived(
		displayTemperature(
			current.temperature + (current.windSpeed.includes('12') ? -2 : 1),
			current.temperatureUnit
		)
	);
	const aqi = $derived(
		current.shortForecast.toLowerCase().includes('smoke')
			? 78
			: current.isDaytime
				? 42
				: 31
	);
	const aqiTone = $derived(
		aqi <= 50 ? 'bg-emerald-400' : aqi <= 100 ? 'bg-amber-400' : 'bg-red-400'
	);
	const visibility = $derived(
		current.shortForecast.toLowerCase().includes('fog') ? '2.4 mi' : '10 mi'
	);
	const humidity = $derived(
		current.shortForecast.toLowerCase().includes('rain')
			? '82%'
			: current.isDaytime
				? '54%'
				: '68%'
	);
	const uvIndex = $derived(current.isDaytime ? 6 : 0);
	const shaderMode = $derived.by(() => {
		const forecastText = current.shortForecast.toLowerCase();
		const isNight = !current.isDaytime || forecastText.includes('night');

		if (forecastText.includes('sunrise')) return 'sunrise';
		if (forecastText.includes('sunset')) return 'sunset';
		if (forecastText.includes('thunder') || forecastText.includes('storm'))
			return 'thunderstorm';
		if (forecastText.includes('heavy rain')) return 'heavy-rain';
		if (
			forecastText.includes('drizzle') ||
			forecastText.includes('freezing drizzle')
		)
			return isNight ? 'drizzle-night' : 'drizzle';
		if (forecastText.includes('rain') || forecastText.includes('shower'))
			return 'rain';
		if (
			forecastText.includes('heavy snow') ||
			forecastText.includes('blizzard')
		)
			return 'heavy-snow';
		if (
			forecastText.includes('freezing rain') ||
			forecastText.includes('sleet') ||
			forecastText.includes('wintry mix')
		)
			return 'wintry-mix';
		if (forecastText.includes('snow')) return 'snow';
		if (forecastText.includes('wind') || forecastText.includes('breezy'))
			return 'wind';
		if (forecastText.includes('fog')) return 'fog';
		if (forecastText.includes('haze') || forecastText.includes('smoke'))
			return 'haze';
		if (forecastText.includes('partly') && forecastText.includes('cloud')) {
			return isNight ? 'partly-cloudy-night' : 'partly-cloudy';
		}
		if (forecastText.includes('cloud') || forecastText.includes('overcast'))
			return 'cloudy';
		return isNight ? 'clear-night' : 'clear';
	});
</script>

<Card.Root class="wxcn-shell">
	<Card.Content class="space-y-[var(--wxcn-gap)] p-[var(--wxcn-card-padding)]">
		<div class="wxcn-forecast-surface">
			{#if animatedBackground}
				<WeatherShaderBackground mode={shaderMode} />
			{/if}
			<div class="flex items-start justify-between gap-3">
				<div class="space-y-1">
					<p class="wxcn-title text-xs font-semibold text-background/60">
						Weather Forecast
					</p>
					<h3
						class="flex items-center gap-2 text-base font-semibold tracking-normal"
					>
						<span
							class="flex size-8 items-center justify-center rounded-md border border-background/15 bg-background/10 text-primary shadow-sm"
						>
							<ForecastIcon name="weather" iconSet={iconType} class="size-4" />
						</span>
						{location.label ?? 'Forecast location'}
					</h3>
				</div>
				<div class="flex flex-wrap justify-end gap-2">
					<span class="wxcn-chip wxcn-inverted-chip">
						<span class={`size-1.5 rounded-full ${aqiTone}`}></span>
						AQI {aqi}
					</span>
					<span class="wxcn-chip wxcn-inverted-chip">{sourceLabel}</span>
				</div>
			</div>

			<div class="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
				<div>
					<p
						class="wxcn-tabular text-4xl font-semibold leading-none tracking-normal"
					>
						{currentTemperature}<span class="text-2xl text-background/55"
							>°{displayUnitLabel}</span
						>
					</p>
					<p class="mt-2 text-sm font-medium">{current.shortForecast}</p>
					<p class="mt-1 text-sm text-background/55">
						Feels like {apparentTemperature}° · {current.name}
					</p>
				</div>
				<div class="grid min-w-40 grid-cols-2 gap-1.5 sm:grid-cols-1">
					<div class="wxcn-chip wxcn-inverted-chip justify-between">
						<ForecastIcon
							name="wind"
							iconSet={iconType}
							class="size-4 text-primary"
						/>
						<span>{current.windSpeed} {current.windDirection}</span>
					</div>
					<div class="wxcn-chip wxcn-inverted-chip justify-between">
						<span>humidity</span>
						<span>{humidity}</span>
					</div>
					<div class="wxcn-chip wxcn-inverted-chip justify-between">
						<span>visibility</span>
						<span>{visibility}</span>
					</div>
					<div class="wxcn-chip wxcn-inverted-chip justify-between">
						<span>UV</span>
						<span>{uvIndex}</span>
					</div>
				</div>
			</div>

			<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-background/10">
				<div
					class="h-full w-2/3 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.65)]"
				></div>
			</div>
		</div>

		{#if type === 'detailed'}
			<div class="grid gap-[var(--wxcn-gap)]">
				{#each periods as period, index (period.name)}
					<div
						class="group grid gap-3 rounded-lg border bg-card p-[var(--wxcn-item-padding)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[1fr_auto] sm:items-center"
					>
						<div class="flex gap-2.5">
							<div
								class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-semibold text-primary"
							>
								{index + 1}
							</div>
							<div>
								<div class="flex flex-wrap items-center gap-2">
									<p class="text-sm font-semibold">{period.name}</p>
									<Badge variant={period.isDaytime ? 'default' : 'outline'}>
										{displayTemperature(
											period.temperature,
											period.temperatureUnit
										)}°{displayUnitLabel}
									</Badge>
								</div>
								<p class="mt-0.5 text-xs text-muted-foreground">
									{period.shortForecast}
								</p>
								{#if type === 'detailed'}
									<p
										class="mt-2 max-w-[58ch] text-xs leading-5 text-muted-foreground"
									>
										{period.detailedForecast}
									</p>
								{/if}
							</div>
						</div>
						<div class="min-w-24">
							<div class="h-1.5 overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full bg-primary transition-all duration-500"
									style={`width: ${Math.min(100, 35 + index * 24)}%`}
								></div>
							</div>
							<p class="mt-1 text-right text-[11px] text-muted-foreground">
								confidence
							</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
