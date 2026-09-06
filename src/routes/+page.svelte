<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Picker from '$lib/components/site/picker.svelte';
	import PMBlock from '$lib/components/site/pm-block.svelte';
	import Logo from '$lib/components/site/logo.svelte';
	import WeatherForecast from '$lib/components/wxcn/WeatherForecast.svelte';
	import MoonForecast from '$lib/components/wxcn/MoonForecast.svelte';
	import TideForecast from '$lib/components/wxcn/TideForecast.svelte';
	import Locate from '@lucide/svelte/icons/locate-fixed';
	import Code from '@lucide/svelte/icons/code';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { sampleWeather } from '$lib/data/weather.js';
	import { sampleTides } from '$lib/data/tides.js';
	import { getMoonForecast, sampleMoon } from '$lib/data/moon.js';
	import type {
		IconSet,
		LocationInput,
		WeatherPeriod,
		TidePrediction,
		WeatherUnit,
		CardDensity,
		ForecastType
	} from '$lib/data/types.js';
	const icons = getContext<{ value: IconSet }>('wxcn-icons');
	let theme = $state('neutral'),
		radius = $state('0.75rem'),
		density = $state<CardDensity>('comfortable'),
		unit = $state<WeatherUnit>('fahrenheit'),
		animation = $state('on');
	let scene = $state('live');
	let codeOpen = $state(false),
		ready = $state(false);
	const item = $derived(
		['weather', 'moon', 'tides'].includes(page.url.searchParams.get('item') ?? '')
			? page.url.searchParams.get('item')!
			: 'all'
	);
	let location = $state<LocationInput>({
		label: 'Austin, TX',
		latitude: 30.2672,
		longitude: -97.7431
	});
	let forecast = $state<WeatherPeriod[]>(sampleWeather),
		moon = $state(sampleMoon),
		tides = $state<TidePrediction[]>(sampleTides);
	let tideLocation = $state<LocationInput>({
		label: 'Galveston Pier 21, TX',
		latitude: 29.31,
		longitude: -94.7933,
		station: '8771450'
	});
	let status = $state<'sample' | 'locating' | 'loading' | 'live' | 'error'>('sample');
	let message = $state('Use your location to see your forecast in every card.'),
		tideSource = $state('Coastal example · station time');
	let locationRequest = 0;
	const themes: Record<string, string> = {
		neutral: '',
		blue: 'oklch(0.546 0.245 262.881)',
		green: 'oklch(0.50 0.14 155)',
		orange: 'oklch(0.60 0.17 45)'
	};
	const sizeOptions = [
		{ size: 'sm', type: 'simple', title: 'Small', description: 'A glance. Just the essentials.' },
		{ size: 'default', type: 'summary', title: 'Standard', description: 'The everyday forecast.' },
		{ size: 'lg', type: 'detailed', title: 'Expanded', description: 'More room for the details.' }
	] as const;
	const conditions: Record<string, string> = {
		rain: 'Rain',
		snow: 'Snow',
		clear: 'Sunny',
		night: 'Clear',
		clouds: 'Partly Cloudy'
	};
	const displayedForecast = $derived(
		scene === 'live'
			? forecast
			: forecast.map((p, i) =>
					i
						? p
						: {
								...p,
								shortForecast: conditions[scene] ?? 'Partly Cloudy',
								isDaytime: scene !== 'night'
							}
				)
	);
	const weatherSource = $derived(
		scene !== 'live'
			? 'Condition preview'
			: status === 'live'
				? 'NWS · live forecast'
				: 'Austin example · sample data'
	);
	function selectItem(value: string) {
		const url = new URL(page.url);
		if (value === 'all') url.searchParams.delete('item');
		else url.searchParams.set('item', value);
		void goto(url, { replaceState: true, noScroll: true, keepFocus: true });
	}
	function reset() {
		theme = 'neutral';
		radius = '0.75rem';
		density = 'comfortable';
		unit = 'fahrenheit';
		animation = 'on';
		scene = 'live';
		icons.value = 'lucide';
	}
	async function updateLocation(coords: { latitude: number; longitude: number }, request: number) {
		status = 'loading';
		message = 'Loading your local forecast…';
		const query = new URLSearchParams({
			latitude: coords.latitude.toFixed(4),
			longitude: coords.longitude.toFixed(4)
		});
		try {
			const response = await fetch(`/api/forecast?${query}`, {
				signal: AbortSignal.timeout(26000)
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message);
			if (request !== locationRequest) return;
			location = data.location;
			forecast = data.forecast;
			moon = getMoonForecast(new Date());
			status = 'live';
			message = `Forecast for ${location.label}.`;
		} catch (error) {
			if (request !== locationRequest) return;
			status = 'error';
			message = `${error instanceof Error ? error.message : 'Could not load weather.'} Showing the Austin example.`;
			return;
		}
		tides = [];
		tideLocation = { ...coords, label: 'Checking nearby tide stations' };
		tideSource = 'Finding a coastal station…';
		try {
			const response = await fetch(`/api/tides?${query}`, { signal: AbortSignal.timeout(26000) });
			const data = await response.json();
			if (!response.ok) throw new Error(data.message);
			if (request !== locationRequest) return;
			tides = data.predictions;
			tideLocation = data.station ?? { ...coords, label: 'No nearby coastal station' };
			tideSource = data.station
				? 'NOAA · live predictions · station time'
				: 'No tide station within 100 km';
		} catch {
			if (request !== locationRequest) return;
			tideLocation = { ...coords, label: 'Tide service unavailable' };
			tideSource = 'Unable to load local tides';
		}
	}
	function resetLocationData() {
		location = { label: 'Austin, TX', latitude: 30.2672, longitude: -97.7431 };
		forecast = sampleWeather;
		tides = sampleTides;
		tideLocation = {
			label: 'Galveston Pier 21, TX',
			latitude: 29.31,
			longitude: -94.7933,
			station: '8771450'
		};
		tideSource = 'Coastal example · station time';
	}

	function useLocation() {
		resetLocationData();
		if (!navigator.geolocation) {
			message = 'Location is unavailable in this browser. Showing the Austin example.';
			status = 'error';
			return;
		}
		const request = ++locationRequest;
		status = 'locating';
		message = 'Waiting for location permission…';
		navigator.geolocation.getCurrentPosition(
			(position) => {
				if (request === locationRequest) void updateLocation(position.coords, request);
			},
			(error) => {
				if (request !== locationRequest) return;
				status = 'error';
				message =
					error.code === 1
						? 'Location permission was declined. Showing the Austin example.'
						: 'Could not determine your location. Showing the Austin example.';
			},
			{ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
		);
	}
	onMount(() => {
		ready = true;
		moon = getMoonForecast(new Date());
		useLocation();
		return () => {
			locationRequest++;
		};
	});
	const registryName = $derived(
		item === 'all' ? 'forecast-dashboard' : item === 'tides' ? 'tide-forecast' : `${item}-forecast`
	);
</script>

<svelte:head
	><title>wxcn-svelte — Make the forecast your own</title><meta
		name="description"
		content="Customize weather, moon, and tide cards for your shadcn-svelte project. Explore sizes, data density, themes, and icons."
	/></svelte:head
>
<main
	class="flex h-[calc(100svh-4rem)] min-h-0 flex-col gap-4 overflow-hidden bg-muted/35 p-4 pt-1 md:flex-row-reverse md:gap-6 md:p-6 md:pt-1"
	data-slot="designer"
>
	<h1 class="sr-only">Customize weather, moon, and tide cards</h1>
	<section class="flex min-h-0 min-w-0 flex-1 flex-col gap-3" aria-label="Forecast previews">
		<div class="flex min-w-0 items-center gap-3 px-1">
			<Logo class="size-5 shrink-0 lg:hidden" />
			<p class="min-w-0 flex-1 truncate text-xs text-muted-foreground">
				Weather components. Your location. Your design system.
			</p>
			<Button size="sm" onclick={() => (codeOpen = true)}><Code class="size-4" />Get code</Button>
		</div>
		<div
			class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-background ring-1 ring-foreground/10"
			style={`--radius:${radius};${themes[theme] ? `--primary:${themes[theme]};--primary-foreground:white;` : ''}`}
		>
			<div
				class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2 md:px-5"
			>
				<nav aria-label="Card collection" class="flex gap-1">
					{#each [{ value: 'all', label: 'All cards' }, { value: 'weather', label: 'Weather' }, { value: 'moon', label: 'Moon' }, { value: 'tides', label: 'Tides' }] as entry}<Button
							size="sm"
							variant={item === entry.value ? 'secondary' : 'ghost'}
							aria-pressed={item === entry.value}
							onclick={() => selectItem(entry.value)}>{entry.label}</Button
						>{/each}
				</nav>
				<Button
					size="sm"
					variant="ghost"
					disabled={status === 'locating' || status === 'loading'}
					onclick={useLocation}
					><Locate class="size-3.5" /><span class="max-w-40 truncate"
						>{status === 'live'
							? location.label
							: status === 'loading'
								? 'Loading forecast…'
								: status === 'locating'
									? 'Locating…'
									: 'Use my location'}</span
					></Button
				>
			</div>
			<div
				class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6"
				data-slot="preview-scroll"
			>
				<p class="mb-6 text-xs leading-5 text-muted-foreground" role="status">{message}</p>
				{#each ['weather', 'moon', 'tides'] as collection}
					{#if item === 'all' || item === collection}
						<section class="mb-10 last:mb-2" aria-label={`${collection} card sizes`}>
							<div class="mb-5 flex items-end justify-between gap-3">
								<div>
									<h2 class="text-lg font-semibold tracking-tight">
										{collection === 'weather'
											? 'Weather forecast'
											: collection === 'moon'
												? 'Moon phase'
												: 'Tide forecast'}
									</h2>
									<p class="mt-1 text-xs text-muted-foreground">
										{collection === 'weather'
											? location.label
											: collection === 'moon'
												? 'The current lunar cycle'
												: tideLocation.label}
									</p>
								</div>
								<span class="text-xs text-muted-foreground">3 sizes</span>
							</div>
							<div
								class="grid items-start gap-5 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1fr)_minmax(0,1.2fr)]"
							>
								{#each sizeOptions as example}
									<div class="min-w-0">
										<div class="mb-3 flex items-baseline justify-between gap-2">
											<span class="text-xs font-medium">{example.title}</span><span
												class="text-[11px] text-muted-foreground"
												>{example.type === 'simple'
													? 'Essential'
													: example.type === 'summary'
														? 'Summary'
														: 'Detailed'}</span
											>
										</div>
										{#if collection === 'weather'}<WeatherForecast
												size={example.size}
												type={example.type}
												{density}
												{unit}
												{location}
												forecast={displayedForecast}
												sourceLabel={weatherSource}
												animatedBackground={animation === 'on'}
											/>
										{:else if collection === 'moon'}<MoonForecast
												size={example.size}
												type={example.type}
												{density}
												{location}
												forecast={moon}
											/>
										{:else}<TideForecast
												size={example.size}
												type={example.type}
												{density}
												predictions={tides}
												location={tideLocation}
												sourceLabel={tideSource}
											/>{/if}
										<p class="mt-3 text-xs text-muted-foreground">{example.description}</p>
									</div>
								{/each}
							</div>
						</section>
					{/if}
				{/each}
			</div>
		</div>
	</section>
	<aside
		class="dark flex shrink-0 flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-xl ring-1 ring-foreground/10 md:w-52 2xl:w-56"
		aria-label="Customize cards"
	>
		<div class="hidden items-center justify-between border-b px-4 py-3 md:flex">
			<span class="text-sm font-medium">Customize</span><Button
				size="icon-xs"
				variant="ghost"
				aria-label="Reset appearance"
				onclick={reset}><RotateCcw class="size-3.5" /></Button
			>
		</div>
		<div
			class="no-scrollbar flex min-h-0 gap-2.5 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto"
			data-slot="picker-scroll"
		>
			<Picker
				label="Theme"
				bind:value={theme}
				options={[
					{ value: 'neutral', label: 'Neutral' },
					{ value: 'blue', label: 'Blue' },
					{ value: 'green', label: 'Green' },
					{ value: 'orange', label: 'Orange' }
				]}
			/>
			<Picker
				label="Icon library"
				bind:value={icons.value}
				options={[
					{ value: 'lucide', label: 'Lucide' },
					{ value: 'hugeicons', label: 'Hugeicons' },
					{ value: 'phosphor-svelte', label: 'Phosphor' },
					{ value: 'tabler', label: 'Tabler' },
					{ value: 'remix', label: 'Remix Icon' }
				]}
			/>
			<Picker
				label="Radius"
				bind:value={radius}
				options={[
					{ value: '0rem', label: 'Square' },
					{ value: '0.5rem', label: 'Medium' },
					{ value: '0.75rem', label: 'Large' },
					{ value: '1rem', label: 'Extra large' }
				]}
			/>
			<Picker
				label="Data density"
				bind:value={density}
				options={[
					{ value: 'comfortable', label: 'Comfortable' },
					{ value: 'compact', label: 'Compact' }
				]}
			/>
			<Picker
				label="Temperature"
				bind:value={unit}
				options={[
					{ value: 'fahrenheit', label: 'Fahrenheit' },
					{ value: 'celsius', label: 'Celsius' }
				]}
			/>
			<Picker
				label="Background"
				bind:value={animation}
				options={[
					{ value: 'on', label: 'Animated' },
					{ value: 'off', label: 'Plain' }
				]}
			/>
			<Picker
				label="Weather preview"
				bind:value={scene}
				options={[
					{ value: 'live', label: 'Local forecast' },
					{ value: 'clear', label: 'Clear sky' },
					{ value: 'clouds', label: 'Clouds' },
					{ value: 'rain', label: 'Rain' },
					{ value: 'snow', label: 'Snow' },
					{ value: 'night', label: 'Night' }
				]}
			/>
		</div>
		<div class="hidden border-t p-3 md:block">
			<Button class="w-full" variant="secondary" onclick={() => (codeOpen = true)}
				><Code class="size-4" />Get code</Button
			>
			<p class="mt-3 px-1 text-[11px] leading-5 text-muted-foreground">
				Your theme and icons come from your project's components.json.
			</p>
		</div>
	</aside>
</main>
<Dialog.Root bind:open={codeOpen}
	><Dialog.Content class="sm:max-w-2xl"
		><Dialog.Header
			><Dialog.Title>Add to your project</Dialog.Title><Dialog.Description
				>Install the selected collection. Your base components, theme, and icon library stay yours.</Dialog.Description
			></Dialog.Header
		><PMBlock
			type="execute"
			command={[
				'shadcn-svelte@latest',
				'add',
				`${ready ? page.url.origin : ''}/r/${registryName}.json`
			]}
		/>
		<p class="text-xs leading-5 text-muted-foreground">
			Use <code>size="sm" | "default" | "lg"</code> and
			<code>density="compact" | "comfortable"</code> to adapt each card.
		</p></Dialog.Content
	></Dialog.Root
>
