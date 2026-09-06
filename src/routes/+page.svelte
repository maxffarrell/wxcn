<script lang="ts">
	import { getContext } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/native-select/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import WeatherForecast from '$lib/components/wxcn/WeatherForecast.svelte';
	import MoonForecast from '$lib/components/wxcn/MoonForecast.svelte';
	import TideForecast from '$lib/components/wxcn/TideForecast.svelte';
	import WeatherShaderBackground, {
		type WeatherShaderMode
	} from '$lib/components/wxcn/WeatherShaderBackground.svelte';
	import type { IconSet, WeatherUnit } from '$lib/data/types.js';
	import { sampleWeather } from '$lib/data/weather.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import MapPin from '@lucide/svelte/icons/map-pin';
	const icons = getContext<{ value: IconSet }>('wxcn-icons');
	let unit = $state<WeatherUnit>('fahrenheit');
	let theme = $state('neutral');
	let radius = $state('0.75rem');
	let animated = $state(true);
	let active = $state('all');
	let copied = $state(false);
	let copyError = $state('');
	let scene = $state<WeatherShaderMode>('partly-cloudy');
	const themes: Record<string, string> = {
		neutral: '',
		blue: 'oklch(0.546 0.245 262.881)',
		green: 'oklch(0.50 0.14 155)',
		orange: 'oklch(0.60 0.17 45)'
	};
	const scenes: { value: WeatherShaderMode; label: string }[] = [
		{ value: 'partly-cloudy', label: 'Clouds' },
		{ value: 'clear', label: 'Clear' },
		{ value: 'sunset', label: 'Sunset' },
		{ value: 'rain', label: 'Rain' },
		{ value: 'snow', label: 'Snow' },
		{ value: 'clear-night', label: 'Night' }
	];
	const command = 'pnpm dlx shadcn-svelte@latest add ';
	async function copyCommand() {
		try {
			await navigator.clipboard.writeText(
				`${command}${window.location.origin}/r/weather-forecast.json`
			);
			copied = true;
			copyError = '';
		} catch {
			copyError = 'Select and copy the command below.';
		}
	}
</script>

<svelte:head
	><title>wxcn-svelte — Weather components for your design system</title><meta
		name="description"
		content="Theme-aware weather, moon, and tide cards built with shadcn-svelte. Copy the code, keep your theme, and make it your own."
	/></svelte:head
>
<main>
	<section class="container flex flex-col items-center pt-16 pb-14 text-center md:pt-16 md:pb-12">
		<Badge variant="secondary" class="mb-6 gap-2"
			>The forecast, in your design system <ArrowRight class="size-3" /></Badge
		>
		<h1
			class="max-w-6xl text-4xl leading-[1.08] font-semibold tracking-[-0.045em] text-balance sm:text-5xl lg:text-5xl"
		>
			The forecast for your design system.
		</h1>
		<p class="mt-5 max-w-2xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg">
			Beautiful weather, moon, and tide components. Built on shadcn-svelte.<br
				class="hidden sm:block"
			/> Your theme. Your icons. Your code.
		</p>
		<div class="mt-7 flex gap-3">
			<Button href="/docs/components">Explore components <ArrowRight class="size-4" /></Button
			><Button href="/registry" variant="outline">View registry</Button>
		</div>
	</section>
	<section
		class="container"
		aria-label="Component playground"
		style={`--radius:${radius};${themes[theme] ? `--primary:${themes[theme]};--primary-foreground:white;` : ''}`}
	>
		<div class="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
			<div class="flex gap-1" aria-label="Component filter">
				{#each [{ value: 'all', label: 'All components' }, { value: 'weather', label: 'Weather' }, { value: 'moon', label: 'Moon' }, { value: 'tides', label: 'Tides' }] as tab}<Button
						size="sm"
						variant={active === tab.value ? 'secondary' : 'ghost'}
						aria-pressed={active === tab.value}
						onclick={() => (active = tab.value)}>{tab.label}</Button
					>{/each}
			</div>
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<MapPin class="size-3.5" />Austin, Texas <span class="mx-1 text-border">/</span>Sample data
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-x-5 gap-y-3 py-5 text-xs">
			<label class="flex items-center gap-2 text-muted-foreground"
				>Theme<Select.Root aria-label="Theme color" bind:value={theme}
					><Select.Option value="neutral">Neutral</Select.Option><Select.Option value="blue"
						>Blue</Select.Option
					><Select.Option value="green">Green</Select.Option><Select.Option value="orange"
						>Orange</Select.Option
					></Select.Root
				></label
			>
			<label class="flex items-center gap-2 text-muted-foreground"
				>Icons<Select.Root aria-label="Icon library" bind:value={icons.value}
					><Select.Option value="lucide">Lucide</Select.Option><Select.Option value="hugeicons"
						>Hugeicons</Select.Option
					><Select.Option value="phosphor-svelte">Phosphor</Select.Option><Select.Option
						value="tabler">Tabler</Select.Option
					><Select.Option value="remix">Remix Icon</Select.Option></Select.Root
				></label
			>
			<label class="flex items-center gap-2 text-muted-foreground"
				>Radius<Select.Root aria-label="Corner radius" bind:value={radius}
					><Select.Option value="0rem">Square</Select.Option><Select.Option value="0.5rem"
						>Medium</Select.Option
					><Select.Option value="0.75rem">Large</Select.Option><Select.Option value="1rem"
						>Extra large</Select.Option
					></Select.Root
				></label
			>
			<div class="flex items-center gap-2 sm:ml-auto">
				<Button
					size="xs"
					variant="outline"
					aria-pressed={animated}
					onclick={() => (animated = !animated)}
					>{animated ? 'Animation on' : 'Animation off'}</Button
				><Select.Root aria-label="Temperature unit" bind:value={unit}
					><Select.Option value="fahrenheit">°F</Select.Option><Select.Option value="celsius"
						>°C</Select.Option
					></Select.Root
				>
			</div>
		</div>
		<div class="grid items-start gap-5 lg:grid-cols-3">
			{#if active === 'all' || active === 'weather'}
				<div class="grid gap-5">
					<WeatherForecast {unit} animatedBackground={animated} />
					<div class="px-1">
						<p class="text-sm font-medium">Weather forecast</p>
						<p class="mt-1 text-xs leading-5 text-muted-foreground">
							A forecast that feels at home in your app.
						</p>
					</div>
				</div>
			{/if}
			{#if active === 'all' || active === 'moon'}<div class="grid gap-5">
					<MoonForecast />{#if active === 'all'}<WeatherForecast
							type="simple"
							{unit}
							forecast={[{ ...sampleWeather[1], name: 'Tonight' }]}
							animatedBackground={animated}
						/>{/if}
				</div>{/if}
			{#if active === 'all' || active === 'tides'}<div class="grid gap-5">
					<TideForecast /><Card.Root
						><Card.Header
							><Card.Title>Made to be yours.</Card.Title><Card.Description
								>Real shadcn-svelte primitives, from the inside out.</Card.Description
							></Card.Header
						><Card.Content class="flex flex-wrap gap-2"
							><Badge variant="secondary">CSS variables</Badge><Badge variant="secondary"
								>Selected icons</Badge
							><Badge variant="secondary">Svelte 5</Badge></Card.Content
						><Card.Footer
							><Button href="/docs/components" variant="outline" class="w-full"
								>Make it your own <ArrowRight class="size-4" /></Button
							></Card.Footer
						></Card.Root
					>
				</div>{/if}
		</div>
		<p class="mt-5 text-xs text-muted-foreground">
			Austin weather and lunar examples. Tide examples use Galveston Pier 21 on the Texas coast. All
			forecasts shown are fixtures.
		</p>
	</section>
	<section class="container mt-20">
		<div class="grid gap-8 border-t pt-10 md:grid-cols-[1fr_1.2fr] md:items-center">
			<div>
				<p class="mb-3 text-xs text-muted-foreground">Small detail. Different feeling.</p>
				<h2 class="text-3xl font-semibold tracking-tight">Let the weather in.</h2>
				<p class="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
					Slow-moving clouds. Soft evening light. Rain with depth. A quiet layer of atmosphere,
					contained within the card.
				</p>
				<div class="mt-6 flex flex-wrap gap-1">
					{#each scenes as s}<Button
							size="sm"
							variant={scene === s.value ? 'secondary' : 'ghost'}
							aria-pressed={scene === s.value}
							onclick={() => (scene = s.value)}>{s.label}</Button
						>{/each}
				</div>
				<p class="mt-4 text-xs text-muted-foreground">
					Respects reduced motion. Pauses when out of view.
				</p>
			</div>
			<Card.Root class="relative isolate min-h-72 overflow-hidden"
				><WeatherShaderBackground mode={scene} paused={!animated} />
				<div
					class="absolute right-5 bottom-5 left-5 rounded-lg border bg-card/95 p-4 text-card-foreground backdrop-blur-sm"
				>
					<p class="text-sm font-medium">
						{scenes.find((s) => s.value === scene)?.label} in the forecast
					</p>
					<p class="mt-1 text-xs text-muted-foreground">
						An atmospheric preview, ready for your card.
					</p>
				</div></Card.Root
			>
		</div>
	</section>
	<section class="container mt-20">
		<div
			class="flex flex-col justify-between gap-6 rounded-xl border bg-muted/20 p-6 sm:flex-row sm:items-center"
		>
			<div>
				<h2 class="text-lg font-medium tracking-tight">
					Copy the component. Keep your conventions.
				</h2>
				<p class="mt-2 text-sm text-muted-foreground">
					The CLI uses your base components, aliases, and selected icon library.
				</p>
			</div>
			<Button variant="outline" onclick={copyCommand}
				>{#if copied}<Check class="size-4" />Copied{:else}<Copy class="size-4" />Copy install
					command{/if}</Button
			>
		</div>
		{#if copyError}<p role="status" class="mt-3 text-sm">{copyError}</p>
			<code class="block overflow-auto p-3 text-xs"
				>{command}{typeof window !== 'undefined'
					? window.location.origin
					: ''}/r/weather-forecast.json</code
			>{/if}
	</section>
</main>
