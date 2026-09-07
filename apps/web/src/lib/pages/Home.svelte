<script lang="ts">
	import LocationSearch from '$lib/components/site/location-search.svelte';
	import { getContext, onMount } from 'svelte';
	import { getPage } from '$lib/page.svelte.js';
	const page = getPage();

	import * as Card from '@wxcn/svelte/components/ui/card/index.js';
	import FrameworkTabs from '$lib/components/site/framework-tabs.svelte';
	import {
		decodePreset,
		generateRandomConfig,
		DEFAULT_PRESET_CONFIG,
		PRESET_STYLES,
		PRESET_BASE_COLOR_KEYS,
		PRESET_THEME_KEYS,
		PRESET_CHART_COLORS,
		PRESET_FONTS,
		PRESET_RADII,
		type Preset
	} from '$lib/preset.js';
	import { fontLoaders } from '$lib/upstream/load-fonts.js';
	import { buildRegistryTheme } from '$lib/upstream/theme.js';
	import { FONT_DEFINITIONS } from '$lib/upstream/font-definitions.js';
	import { mode } from 'mode-watcher';
	import { Button } from '@wxcn/svelte/components/ui/button/index.js';
	import * as Dialog from '@wxcn/svelte/components/ui/dialog/index.js';
	import Picker from '$lib/components/site/picker.svelte';
	import PMBlock from '$lib/components/site/pm-block.svelte';
	import Logo from '$lib/components/site/logo.svelte';
	import WeatherForecast from '@wxcn/svelte/components/wxcn/WeatherForecast.svelte';
	import MoonForecast from '@wxcn/svelte/components/wxcn/MoonForecast.svelte';
	import TideForecast from '@wxcn/svelte/components/wxcn/TideForecast.svelte';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import CloudSun from '@lucide/svelte/icons/cloud-sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Waves from '@lucide/svelte/icons/waves';
	import { sampleWeather, sampleCurrentWeather } from '@wxcn/core/weather.js';
	import { sampleTides } from '@wxcn/core/tides.js';
	import { getMoonForecast, sampleMoon } from '@wxcn/core/moon.js';
	import type {
		IconSet,
		LocationInput,
		WeatherPeriod,
		TidePrediction,
		TidePoint,
		TideReading,
		WeatherUnit,
		TideUnit,
		CardDensity,
		ForecastType
	} from '@wxcn/core/types.js';
	const icons = getContext<{ value: IconSet }>('wxcn-icons');
	let theme = $state('neutral'),
		radius = $state('default'),
		density = $state<CardDensity>('comfortable'),
		unit = $state<WeatherUnit>('fahrenheit'),
		animation = $state('on');
	let scene = $state('live');
	let tideUnit = $state<TideUnit>('ft'),
		windUnit = $state<'mph' | 'km/h' | 'm/s' | 'knots'>('mph');
	let base = $state('neutral'),
		chartColor = $state('neutral'),
		font = $state('inter'),
		heading = $state('inherit');
	let presetOpen = $state(false),
		presetInput = $state('');
	let style = $state('nova'),
		menuAccent = $state('subtle'),
		menuColor = $state('default');
	const config = $derived({
		style,
		baseColor: base,
		theme,
		chartColor,
		font,
		fontHeading: heading,
		iconLibrary:
			icons.value === 'phosphor-svelte'
				? 'phosphor'
				: icons.value === 'remix'
					? 'remixicon'
					: icons.value,
		radius,
		menuAccent,
		menuColor
	} as Preset);
	const nextPreset = $derived(decodePreset(presetInput.trim().replace(/^--preset\s+/, '')));
	function applyPreset(p: Preset) {
		style = p.style;
		base = p.baseColor;
		theme = p.theme;
		chartColor = p.chartColor ?? DEFAULT_PRESET_CONFIG.chartColor!;
		font = p.font;
		heading = p.fontHeading;
		radius = p.radius;
		menuAccent = p.menuAccent;
		menuColor = p.menuColor;
		icons.value =
			p.iconLibrary === 'phosphor'
				? 'phosphor-svelte'
				: p.iconLibrary === 'remixicon'
					? 'remix'
					: p.iconLibrary;
	}
	function shuffle() {
		applyPreset(generateRandomConfig());
	}
	const options = (values: readonly string[]) =>
		values.map((value) => ({
			value,
			label: value
				.split('-')
				.map((w) => w[0].toUpperCase() + w.slice(1))
				.join(' ')
		}));
	function openPreset() {
		if (nextPreset) {
			applyPreset(nextPreset);
			presetOpen = false;
			presetInput = '';
		}
	}
	let visitorTimeZone = $state('UTC');
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
		longitude: -97.7431,
		timeZone: 'America/Chicago'
	});
	let forecast = $state<WeatherPeriod[]>(sampleWeather),
		moon = $state(sampleMoon),
		tides = $state<TidePrediction[]>(sampleTides);
	let tideSeries = $state<TidePoint[] | undefined>(undefined);
	let tideReading = $state<TideReading | null>(null);
	let tideLocation = $state<LocationInput>({
		label: 'Galveston Pier 21, TX',
		latitude: 29.31,
		longitude: -94.7933,
		station: '8771450',
		timeZone: 'America/Chicago'
	});
	let currentWeather = $state<import('@wxcn/core/types.js').CurrentWeather | null>(
		sampleCurrentWeather
	);
	let showTemperatureTrend = $state(true);
	let showHighLow = $state(false);
	let status = $state<'sample' | 'locating' | 'loading' | 'live' | 'error'>('sample');
	let message = $state('Use your location to see your forecast in every card.'),
		tideSource = $state('Coastal example · station time');
	let locationRequest = 0;

	let tideLoading = $state(false);
	let tideRequest = 0;
	$effect(() => {
		for (const name of [font, heading]) {
			const definition = FONT_DEFINITIONS.find((f) => f.name === name);
			if (definition) void fontLoaders[definition.dependency]();
		}
	});
	const registryTheme = $derived(buildRegistryTheme(config));
	const previewStyle = $derived.by(() => {
		const vars = {
			...registryTheme.cssVars.light,
			...(mode.current === 'dark' ? registryTheme.cssVars.dark : {})
		};
		const family = FONT_DEFINITIONS.find((f) => f.name === font)?.family;
		const headingFamily =
			heading === 'inherit' ? family : FONT_DEFINITIONS.find((f) => f.name === heading)?.family;
		return (
			Object.entries(vars)
				.map(([k, v]) => `--${k}:${v}`)
				.join(';') +
			`;font-family:${family};--font-sans:${family};--font-heading:${headingFamily};--preview-heading:${headingFamily}`
		);
	});
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
								temperature:
									scene === 'snow' ? (p.temperatureUnit === 'C' ? -2 : 28) : p.temperature,
								isDaytime: scene !== 'night'
							}
				)
	);
	const weatherSource = $derived(
		scene !== 'live'
			? 'Condition preview'
			: status === 'live'
				? 'NWS · live forecast'
				: 'Sample forecast'
	);
	function selectItem(value: string) {
		const url = new URL(page.url);
		if (value === 'all') url.searchParams.delete('item');
		else url.searchParams.set('item', value);
		page.replace(url);
	}
	function reset() {
		applyPreset(DEFAULT_PRESET_CONFIG);
		density = 'comfortable';
		unit = 'fahrenheit';
		tideUnit = 'ft';
		windUnit = 'mph';
		animation = 'on';
		scene = 'live';
		showTemperatureTrend = true;
		showHighLow = false;
	}
	async function updateLocation(
		coords: { latitude: number; longitude: number; label?: string },
		request: number
	) {
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
			location = { ...data.location, label: coords.label ?? data.location.label };
			forecast = data.forecast;
			currentWeather = data.currentWeather ?? null;
			moon = getMoonForecast(new Date());
			status = 'live';
			message = `Forecast for ${location.label}.`;
		} catch (error) {
			if (request !== locationRequest) return;
			status = 'error';
			message = `${error instanceof Error ? error.message : 'Could not load weather.'} Showing the Austin example.`;
			await updateTides(coords);
			return;
		}
		await updateTides(coords);
	}
	async function updateTides(coords: { latitude: number; longitude: number }) {
		const request = ++tideRequest;
		const query = new URLSearchParams({
			latitude: String(coords.latitude),
			longitude: String(coords.longitude),
			nearest: 'true'
		});
		tideLoading = true;
		tides = [];
		tideSeries = [];
		tideReading = null;
		tideLocation = { ...coords, label: 'Checking nearby tide stations' };
		tideSource = 'Finding a coastal station…';
		try {
			const response = await fetch(`/api/tides?${query}`, { signal: AbortSignal.timeout(26000) });
			const data = await response.json();
			if (!response.ok) throw new Error(data.message);
			if (request !== tideRequest) return;
			tides = data.predictions;
			tideSeries = data.series ?? [];
			tideReading = data.reading ?? null;
			tideLocation = data.station
				? {
						...data.station,
						timeZone: data.station.timeZone
					}
				: { ...coords, label: 'No nearby coastal station' };
			tideSource = data.station
				? `NOAA · ${data.station.distanceKm} km from ${coords.latitude === location.latitude && coords.longitude === location.longitude ? (location.label ?? 'your location') : 'your location'}`
				: 'No coastal tide station available';
		} catch {
			if (request !== tideRequest) return;
			tideLocation = { ...coords, label: 'Tide service unavailable' };
			tideSource = 'Unable to load local tides';
		} finally {
			if (request === tideRequest) tideLoading = false;
		}
	}
	function resetLocationData() {
		++tideRequest;
		tideLoading = false;
		location = {
			label: 'Austin, TX',
			latitude: 30.2672,
			longitude: -97.7431,
			timeZone: 'America/Chicago'
		};
		forecast = sampleWeather;
		currentWeather = sampleCurrentWeather;
		tides = sampleTides;
		tideSeries = undefined;
		tideReading = null;
		tideLocation = {
			label: 'Galveston Pier 21, TX',
			latitude: 29.31,
			longitude: -94.7933,
			station: '8771450',
			timeZone: 'America/Chicago'
		};
		tideSource = 'Coastal example · station time';
	}

	function useLocation() {
		resetLocationData();
		if (!navigator.geolocation) {
			message =
				'Location is unavailable in this browser. Showing Austin and its nearest coastal station.';
			void updateTides(location);
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
						? 'Location permission was declined. Showing Austin weather and its nearest coastal station.'
						: 'Could not determine your location. Showing the Austin example.';
				void updateTides(location);
			},
			{ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
		);
	}
	onMount(() => {
		const saved = decodePreset(page.url.searchParams.get('preset') ?? '');
		if (saved) applyPreset(saved);
		visitorTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		ready = true;
		moon = getMoonForecast(new Date());
		useLocation();
		return () => {
			locationRequest++;
			tideRequest++;
		};
	});
	const registryName = $derived(
		item === 'all' ? 'forecast-dashboard' : item === 'tides' ? 'tide-forecast' : `${item}-forecast`
	);
</script>

<svelte:head
	><title>wxcn — Make the forecast your own</title><meta
		name="description"
		content="Customize weather, moon, and tide cards for your shadcn-svelte project. Explore sizes, data density, themes, and icons."
	/></svelte:head
>

{#snippet card(
	collection: string,
	variant: 'simple' | 'summary' | 'detailed' = 'summary',
	size: 'sm' | 'default' | 'lg' = 'default',
	cardDensity: CardDensity = density
)}
	{#if collection === 'weather'}<WeatherForecast
			{size}
			type={variant}
			density={cardDensity}
			{unit}
			{windUnit}
			iconType={icons.value}
			forecast={displayedForecast}
			currentWeather={scene === 'live'
				? currentWeather
				: {
						...sampleCurrentWeather,
						...displayedForecast[0],
						name: 'Now',
						observedAt: sampleCurrentWeather.observedAt
					}}
			{showTemperatureTrend}
			{showHighLow}
			at={status === 'live' && scene === 'live'
				? undefined
				: Date.parse(sampleCurrentWeather.observedAt)}
			{location}
			sourceLabel={weatherSource}
			animatedBackground={animation === 'on'}
		/>
	{:else if collection === 'moon'}<MoonForecast
			{size}
			type={variant}
			density={cardDensity}
			iconType={icons.value}
			forecast={moon}
			{location}
		/>
	{:else}<TideForecast
			{size}
			type={variant}
			density={cardDensity}
			unit={tideUnit}
			iconType={icons.value}
			predictions={tides}
			example={tideSeries === undefined}
			series={tideSeries}
			reading={tideReading}
			location={tideLocation}
			sourceLabel={`${tideSource.replace(' · station time', '')} · ${visitorTimeZone}`}
		/>{/if}
{/snippet}
<main
	class="flex h-[calc(100svh-4rem)] min-h-0 flex-col gap-4 overflow-hidden bg-background p-4 pt-1 md:flex-row-reverse md:gap-6 md:p-6 md:pt-1"
	data-slot="designer"
>
	<h1 class="sr-only">wxcn — weather, moon, and tide components</h1>
	<section class="flex min-h-0 min-w-0 flex-1 flex-col gap-3" aria-label="Forecast previews">
		<div
			class={`preview-surface style-${style} relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl ring ring-foreground/10`}
			style={previewStyle}
		>
			<div
				class="flex shrink-0 flex-nowrap items-center gap-1 border-b bg-background px-2 py-2 sm:gap-2 sm:px-3"
			>
				<nav class="flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label="Card collection">
					{#each [{ value: 'all', label: 'All cards', icon: LayoutGrid }, { value: 'weather', label: 'Weather', icon: CloudSun }, { value: 'moon', label: 'Moon', icon: Moon }, { value: 'tides', label: 'Tides', icon: Waves }] as entry}<Button
							size="sm"
							variant={item === entry.value ? 'secondary' : 'ghost'}
							aria-pressed={item === entry.value}
							class="size-8 shrink-0 px-0 sm:w-auto sm:px-3"
							title={entry.label}
							onclick={() => selectItem(entry.value)}
							><entry.icon class="size-4 sm:hidden" aria-hidden="true" /><span
								class="sr-only sm:not-sr-only">{entry.label}</span
							></Button
						>{/each}
				</nav>
				<LocationSearch
					label={location.label ?? ''}
					onselect={(place) => {
						scene = 'live';
						void updateLocation(place, ++locationRequest);
					}}
					onlocate={useLocation}
				/>
				<FrameworkTabs />
			</div>
			<p class="sr-only" role="status">{message}</p>
			<div
				class="min-h-0 flex-1 overflow-auto overscroll-contain bg-muted dark:bg-background"
				data-slot="preview-scroll"
				role="region"
				aria-label={item === 'all' ? 'Component canvas, scroll to explore' : 'Component examples'}
			>
				{#if item === 'all'}
					<div class="flex w-full min-w-max justify-center">
						<div
							class="grid w-[1500px] grid-cols-[280px_360px_280px_400px] items-start gap-8 p-8 md:w-[1650px] md:grid-cols-[300px_400px_300px_430px] md:gap-10 md:p-10"
							data-slot="capture-target"
						>
							<div class="flex flex-col gap-8">
								{@render card('weather', 'simple', 'sm')}{@render card(
									'moon',
									'summary'
								)}{@render card('tides', 'simple', 'sm')}
							</div>
							<div class="flex flex-col gap-8">
								{@render card('tides', 'summary')}{@render card('weather', 'summary')}{@render card(
									'moon',
									'simple',
									'sm'
								)}
							</div>
							<div class="flex flex-col gap-8">
								{@render card('moon', 'detailed', 'lg')}{@render card(
									'weather',
									'simple'
								)}{@render card('tides', 'simple')}
							</div>
							<div class="flex flex-col gap-8">
								{@render card('weather', 'detailed', 'lg')}{@render card('tides', 'detailed', 'lg')}
							</div>
						</div>
					</div>
				{:else}
					<div
						data-slot="example-wrapper"
						class="mx-auto grid min-h-full w-full max-w-5xl min-w-0 content-center items-start gap-8 p-4 pt-2 sm:gap-12 sm:p-6 md:grid-cols-2 md:gap-8 lg:p-12 2xl:max-w-6xl"
					>
						{#each [{ label: 'Default', type: 'summary', size: 'default' }, { label: 'Small', type: 'simple', size: 'sm' }, { label: 'Detailed', type: 'detailed', size: 'lg' }, { label: 'Compact', type: 'summary', size: 'sm' }] as example}
							<section class="grid min-w-0 gap-4">
								<h2 class="text-sm font-medium">{example.label}</h2>
								<div
									class="max-w-full min-w-[220px] [resize:horizontal] overflow-auto"
									aria-label="Resizable card preview"
								>
									{@render card(
										item,
										example.type as ForecastType,
										example.size as 'sm' | 'default' | 'lg',
										example.label === 'Compact' ? 'compact' : density
									)}
								</div>
							</section>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</section>
	<div class="isolate z-10 flex min-h-0 w-full flex-col gap-2 md:w-48 2xl:w-56">
		<Card.Root
			class="dark isolate z-10 max-h-full min-h-0 w-full self-start rounded-2xl bg-card/90 shadow-xl backdrop-blur-xl md:w-48 2xl:w-56"
			size="sm"
		>
			<Card.Header class="hidden items-center justify-between gap-2 border-b md:flex"
				><span class="text-sm font-medium">Customize</span><Button
					size="icon-xs"
					variant="ghost"
					aria-label="Reset appearance"
					onclick={reset}><RotateCcw class="size-3.5" /></Button
				></Card.Header
			>
			<Card.Content
				data-slot="picker-scroll"
				class="no-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-hidden md:overflow-y-auto"
			>
				<div class="flex flex-row gap-2.5 py-px md:flex-col md:gap-3.25">
					<Picker label="Style" bind:value={style} options={options(PRESET_STYLES)} />
					<div class="-mx-4 hidden w-auto border-t md:block"></div>
					<Picker label="Base color" bind:value={base} options={options(PRESET_BASE_COLOR_KEYS)} />

					<Picker label="Theme" bind:value={theme} options={options(PRESET_THEME_KEYS)} />
					<Picker
						label="Chart color"
						bind:value={chartColor}
						options={options(PRESET_CHART_COLORS)}
					/>
					<div class="-mx-4 hidden w-auto border-t md:block"></div>
					<Picker
						label="Heading"
						bind:value={heading}
						options={options(['inherit', ...PRESET_FONTS])}
					/>
					<Picker label="Font" bind:value={font} options={options(PRESET_FONTS)} />
					<div class="-mx-4 hidden w-auto border-t md:block"></div>
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
						options={Object.values(PRESET_RADII).map((r) => ({ value: r.name, label: r.label }))}
					/>
					<div class="-mx-4 hidden w-auto border-t md:block"></div>
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
					/><Picker
						label="Tide height"
						bind:value={tideUnit}
						options={[
							{ value: 'ft', label: 'Feet' },
							{ value: 'meter', label: 'Meters' }
						]}
					/>
					<Picker
						label="Wind speed"
						bind:value={windUnit}
						options={['mph', 'km/h', 'm/s', 'knots'].map((value) => ({ value, label: value }))}
					/>
				</div></Card.Content
			>
			<Card.Footer class="flex min-w-0 gap-2 md:flex-col md:**:[button,a]:w-full">
				<Button
					variant="outline"
					onclick={() => (codeOpen = true)}
					class="min-w-0 flex-1 touch-manipulation overflow-hidden bg-transparent! px-2! py-0! text-sm! transition-none select-none hover:bg-muted! md:flex-none pointer-coarse:h-10!"
					>Get Code</Button
				>
				<Button
					variant="outline"
					onclick={() => (presetOpen = true)}
					class="max-w-20 min-w-0 flex-1 touch-manipulation bg-transparent! px-2! py-0! text-sm! transition-none select-none hover:bg-muted! sm:max-w-none md:flex-none pointer-coarse:h-10!"
					>Open</Button
				>
				<Button
					variant="outline"
					onclick={shuffle}
					class="max-w-20 min-w-0 flex-1 touch-manipulation bg-transparent! px-2! py-0! text-sm! transition-none select-none hover:bg-muted! sm:max-w-none md:flex-none pointer-coarse:h-10!"
					>Shuffle</Button
				>
			</Card.Footer>
		</Card.Root>
	</div>
</main>
<Dialog.Root bind:open={presetOpen}
	><Dialog.Content class="dark"
		><form
			onsubmit={(e) => {
				e.preventDefault();
				openPreset();
			}}
		>
			<Dialog.Header
				><Dialog.Title>Open Preset</Dialog.Title><Dialog.Description
					>Paste a shadcn-svelte preset code to load a saved configuration.</Dialog.Description
				></Dialog.Header
			><label for="preset-code" class="sr-only">Preset code</label><input
				id="preset-code"
				bind:value={presetInput}
				placeholder="b0 or --preset b0"
				class="my-4 h-10 w-full rounded-md border bg-transparent px-3 text-sm"
				aria-invalid={presetInput.length > 0 && !nextPreset}
			/>{#if presetInput.length > 0 && !nextPreset}<p class="mb-3 text-xs text-destructive">
					Enter a valid shadcn-svelte preset.
				</p>{/if}<Dialog.Footer
				><Button type="button" variant="outline" onclick={() => (presetOpen = false)}>Cancel</Button
				><Button type="submit" disabled={!nextPreset}>Open</Button></Dialog.Footer
			>
		</form></Dialog.Content
	></Dialog.Root
>
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
				`${ready ? page.url.origin : ''}/r/svelte/${registryName}.json`
			]}
		/>
		<p class="text-xs leading-5 text-muted-foreground">
			Use <code>size="sm" | "default" | "lg"</code> and
			<code>density="compact" | "comfortable"</code> to adapt each card.
		</p></Dialog.Content
	></Dialog.Root
>

<style>
	.preview-surface :global([data-slot='card-title']) {
		font-family: var(--preview-heading);
	}
</style>
