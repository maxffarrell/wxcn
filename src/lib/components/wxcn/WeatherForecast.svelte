<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
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
		location = {
			label: 'Santa Monica, CA',
			latitude: 34.0195,
			longitude: -118.4912
		},
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
	const hourlyForecast = $derived([
		current,
		...forecast.slice(1, 3),
		{
			...current,
			name: '1 PM',
			temperature: current.temperature + 4,
			shortForecast: 'Sunny'
		},
		{
			...current,
			name: '2 PM',
			temperature: current.temperature + 4,
			shortForecast: 'Sunny'
		},
		{
			...current,
			name: '3 PM',
			temperature: current.temperature + 3,
			shortForecast: 'Mostly Sunny'
		}
	].slice(0, type === 'simple' ? 4 : 6));
	const dailyForecast = $derived([
		{ day: 'Saturday', icon: 'clear', high: 72, low: 58 },
		{ day: 'Sunday', icon: 'cloudy', high: 69, low: 57 },
		{ day: 'Monday', icon: 'partly-cloudy', high: 70, low: 59 },
		{ day: 'Tuesday', icon: 'clear', high: 73, low: 60 },
		{ day: 'Wednesday', icon: 'clear', high: 74, low: 61 }
	]);
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

<Card.Root
	class={`wxcn-widget-card ${animatedBackground ? 'wxcn-weather-animated' : ''}`}
>
	{#if animatedBackground}
		<div class="wxcn-widget-shader" aria-hidden="true">
			<WeatherShaderBackground mode={shaderMode} />
		</div>
	{/if}
	<Card.Header class="wxcn-widget-header">
		<div class="flex items-start gap-3">
			<span class="wxcn-widget-icon text-primary">
				<ForecastIcon name="weather" iconSet={iconType} class="size-5" />
			</span>
			<div>
				<Card.Title class="text-lg tracking-normal">
					Weather
				</Card.Title>
				<Card.Description class="mt-1.5">
					{location.label ?? 'Santa Monica, CA'}
				</Card.Description>
			</div>
		</div>
		<Card.Action>
			<Button variant="ghost" size="icon-sm" aria-label="Open weather forecast">
				<span class="text-xl leading-none">›</span>
			</Button>
		</Card.Action>
	</Card.Header>

	<Card.Content class="relative px-0">
		<div
			class="grid gap-5 px-[var(--wxcn-card-padding)] py-[var(--wxcn-card-padding)] sm:grid-cols-[minmax(0,1fr)_minmax(8.75rem,auto)] sm:items-center"
		>
			<div class="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
				<div class="flex justify-center sm:justify-start">
					<ForecastIcon
						name="weather"
						iconSet={iconType}
						class="size-20 text-primary drop-shadow-sm"
					/>
				</div>
				<div>
					<div class="flex items-start gap-2">
						<p class="wxcn-tabular text-6xl font-semibold leading-none tracking-normal">
							{currentTemperature}
						</p>
						<span class="mt-2 text-2xl font-semibold">°{displayUnitLabel}</span>
					</div>
					<p class="mt-2 text-base text-muted-foreground">
						{current.shortForecast}
					</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Feels like {apparentTemperature}°
					</p>
				</div>
			</div>

			<div class="grid min-w-0 gap-3 border-border/80 sm:border-l sm:pl-6">
				<div
					class="grid grid-cols-[1.25rem_auto_minmax(3.75rem,1fr)] items-center gap-2 text-sm"
				>
					<ForecastIcon name="wind" iconSet={iconType} class="size-4 text-muted-foreground" />
					<span class="font-medium">{current.windSpeed}</span>
					<span class="truncate text-right text-muted-foreground">{current.windDirection}</span>
				</div>
				<div
					class="grid grid-cols-[1.25rem_auto_minmax(3.75rem,1fr)] items-center gap-2 text-sm"
				>
					<span class="text-muted-foreground">◌</span>
					<span class="font-medium">{humidity}</span>
					<span class="truncate text-right text-muted-foreground">Humidity</span>
				</div>
				<div
					class="grid grid-cols-[1.25rem_auto_minmax(3.75rem,1fr)] items-center gap-2 text-sm"
				>
					<span class="text-muted-foreground">◒</span>
					<span class="font-medium">30.12 in</span>
					<span class="truncate text-right text-muted-foreground">Pressure</span>
				</div>
				<div
					class="grid grid-cols-[1.25rem_auto_minmax(3.75rem,1fr)] items-center gap-2 text-sm"
				>
					<span class="text-muted-foreground">◉</span>
					<span class="font-medium">{visibility}</span>
					<span class="truncate text-right text-muted-foreground">Visibility</span>
				</div>
				<Badge variant="outline" class="mt-1 w-fit gap-1.5">
					<span class={`size-1.5 rounded-full ${aqiTone}`}></span>
					AQI {aqi}
				</Badge>
			</div>
		</div>

		<div class="grid grid-cols-6 border-y bg-muted/20">
			{#each hourlyForecast as period (period.name)}
				<div class="grid justify-items-center gap-2 px-2 py-4 text-center">
					<p class="text-sm font-medium">{period.name}</p>
					<ForecastIcon name="weather" iconSet={iconType} class="size-6 text-primary" />
					<p class="wxcn-tabular text-sm font-semibold">
						{displayTemperature(period.temperature, period.temperatureUnit)}°
					</p>
				</div>
			{/each}
		</div>

		{#if type !== 'simple'}
			<div class="grid gap-3 px-[var(--wxcn-card-padding)] py-4">
				{#each dailyForecast as day (day.day)}
					<div class="grid grid-cols-[1fr_auto_3rem_3rem] items-center gap-4 text-sm">
						<span>{day.day}</span>
						<ForecastIcon name="weather" iconSet={iconType} class="size-5 text-primary" />
						<span class="wxcn-tabular text-right font-medium">{day.high}°</span>
						<span class="wxcn-tabular text-right text-muted-foreground">{day.low}°</span>
					</div>
				{/each}
				<Button variant="outline" class="mt-1 w-full">
					View 7-Day Forecast
					<span class="ml-2 text-xs">↗</span>
				</Button>
			</div>
		{/if}

		{#if type === 'detailed'}
			<div class="grid gap-[var(--wxcn-gap)] border-t px-[var(--wxcn-card-padding)] py-4">
				{#each periods as period, index (period.name)}
					<div class="wxcn-detail-period">
						<div class="flex gap-2.5">
							<div class="wxcn-index-badge">
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
