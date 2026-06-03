<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import MoonForecast from '$lib/components/wxcn/MoonForecast.svelte';
	import TideForecast from '$lib/components/wxcn/TideForecast.svelte';
	import WeatherForecast from '$lib/components/wxcn/WeatherForecast.svelte';
	import WeatherShaderBackground, {
		type WeatherShaderMode
	} from '$lib/components/wxcn/WeatherShaderBackground.svelte';

	const shaderScenes: {
		mode: WeatherShaderMode;
		label: string;
		description: string;
	}[] = [
		{
			mode: 'clear',
			label: 'Clear',
			description: 'Sun bloom, cirrus, and atmospheric depth'
		},
		{
			mode: 'fog',
			label: 'Fog',
			description: 'Layered veil bands and low horizon haze'
		},
		{
			mode: 'rain',
			label: 'Rain',
			description: 'Layered WebGL precipitation'
		},
		{
			mode: 'thunderstorm',
			label: 'Thunderstorm',
			description: 'Lightning, rain, and glass runoff'
		},
		{
			mode: 'snow',
			label: 'Snow',
			description: 'Parallax flakes and atmospheric haze'
		},
		{
			mode: 'clear-night',
			label: 'Night',
			description: 'Moon glow, stars, and cool film grading'
		}
	];

	const allShaderScenes: {
		mode: WeatherShaderMode;
		label: string;
	}[] = [
		{ mode: 'sunrise', label: 'Sunrise' },
		{ mode: 'sunset', label: 'Sunset' },
		{ mode: 'clear', label: 'Clear' },
		{ mode: 'partly-cloudy', label: 'Partly cloudy' },
		{ mode: 'haze', label: 'Haze' },
		{ mode: 'fog', label: 'Fog' },
		{ mode: 'wind', label: 'Wind' },
		{ mode: 'cloudy', label: 'Cloudy' },
		{ mode: 'thunderstorm', label: 'Thunderstorm' },
		{ mode: 'rain', label: 'Rain' },
		{ mode: 'heavy-rain', label: 'Heavy rain' },
		{ mode: 'drizzle', label: 'Drizzle' },
		{ mode: 'snow', label: 'Snow' },
		{ mode: 'heavy-snow', label: 'Heavy snow' },
		{ mode: 'wintry-mix', label: 'Wintry mix' },
		{ mode: 'clear-night', label: 'Clear night' },
		{ mode: 'partly-cloudy-night', label: 'Partly night' },
		{ mode: 'drizzle-night', label: 'Drizzle night' }
	];

	const quickLinks = [
		{
			title: 'Registry components',
			description: 'Weather, tide, moon, and dashboard cards built for shadcn-svelte.',
			href: '/docs/components'
		},
		{
			title: 'Open endpoints',
			description: 'NWS, NOAA CO-OPS, and local lunar calculations with no API keys.',
			href: '/docs/endpoints'
		},
		{
			title: 'Registry JSON',
			description: 'Inspect the generated registry before adding components to your app.',
			href: '/registry'
		}
	];

	const capabilities = [
		{
			title: 'Style-aware',
			description: 'Reads the same radius, color, shadow, and spacing tokens as shadcn-svelte.'
		},
		{
			title: 'Typed props',
			description: 'Switch density, icon set, location, weather units, tide units, and animated weather.'
		},
		{
			title: 'Card-first',
			description: 'Compact forecast cards for dashboards, docs pages, sidebars, and landing pages.'
		}
	];

	const installCommand =
		'pnpm dlx shadcn-svelte@latest add https://wxcn.dev/registry.json';
</script>

<svelte:head>
	<title>wxcn-svelte</title>
	<meta
		name="description"
		content="shadcn-svelte registry components for weather, tides, and moon forecasts."
	/>
</svelte:head>

<main class="wxcn-home">
	<section class="wxcn-home-hero border-b">
		<div class="container max-w-7xl py-5 md:py-8">
			<div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
				<div class="max-w-2xl">
					<h1 class="text-balance text-4xl font-semibold leading-none tracking-normal md:text-5xl">
						wxcn-svelte
					</h1>
					<p class="mt-2 max-w-xl text-pretty text-base leading-7 text-muted-foreground">
						Weather, tide, and moon forecast cards that copy into your
						SvelteKit app and keep the shadcn-svelte aesthetic.
					</p>
				</div>
				<div class="flex flex-wrap gap-3 md:justify-end">
					<a href="/docs/components"><Button>Browse components</Button></a>
					<a href="/registry"><Button variant="outline">View registry</Button></a>
				</div>
			</div>

			<div class="wxcn-home-preview mt-6 md:mt-7">
				<div class="wxcn-home-preview-stage">
					<div class="grid gap-4 lg:grid-cols-3">
						<TideForecast type="summary" iconType="lucide" />
						<MoonForecast type="summary" iconType="lucide" />
						<WeatherForecast
							type="summary"
							iconType="lucide"
							animatedBackground
						/>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="border-b">
		<div class="container max-w-7xl py-10 md:py-14">
			<Card.Root class="mb-4 overflow-hidden border bg-background/75 shadow-sm">
				<Card.Content class="p-0">
					<div class="flex items-center gap-2 border-b bg-muted/35 px-4 py-2">
						<span class="size-2 rounded-full bg-destructive/80"></span>
						<span class="size-2 rounded-full bg-yellow-500/80"></span>
						<span class="size-2 rounded-full bg-green-500/80"></span>
						<span class="ml-2 text-xs text-muted-foreground">install</span>
					</div>
					<div class="overflow-x-auto p-4 font-mono text-sm">
						<span class="text-muted-foreground">$</span>
						{installCommand}
					</div>
				</Card.Content>
			</Card.Root>

			<div class="grid gap-4 md:grid-cols-3">
				{#each capabilities as item (item.title)}
					<Card.Root class="bg-background/70 shadow-sm transition-colors hover:bg-muted/30">
						<Card.Header class="space-y-2">
							<Card.Title class="text-base tracking-normal">{item.title}</Card.Title>
							<Card.Description class="leading-6">{item.description}</Card.Description>
						</Card.Header>
					</Card.Root>
				{/each}
			</div>
		</div>
	</section>

	<section class="border-b bg-muted/20">
		<div class="container max-w-7xl py-14 md:py-16">
			<div class="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<h2 class="text-3xl font-semibold tracking-normal">
						WebGL weather backgrounds
					</h2>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
						Use the weather card's animated background prop to render condition-aware
						shaders inside the card surface.
					</p>
				</div>
				<a href="/docs/components"><Button variant="outline">Read docs</Button></a>
			</div>
			<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{#each shaderScenes as scene (scene.mode)}
					<Card.Root class="wxcn-shader-showcase-card">
						<WeatherShaderBackground mode={scene.mode} />
						<div class="wxcn-shader-showcase-content">
							<p class="font-medium tracking-normal">{scene.label}</p>
							<p class="mt-1 text-xs text-white/70">{scene.description}</p>
						</div>
					</Card.Root>
				{/each}
			</div>
			<div class="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
				{#each allShaderScenes as scene (scene.mode)}
					<Card.Root class="wxcn-shader-swatch-card">
						<WeatherShaderBackground mode={scene.mode} />
						<div class="wxcn-shader-swatch-content">
							<p>{scene.label}</p>
						</div>
					</Card.Root>
				{/each}
			</div>
		</div>
	</section>

	<section>
		<div class="container max-w-7xl py-14 md:py-16">
			<div class="grid gap-4 md:grid-cols-3">
				{#each quickLinks as link (link.href)}
					<a href={link.href} class="group block">
						<Card.Root class="h-full transition-colors group-hover:bg-muted/40">
							<Card.Header>
								<Card.Title class="text-base tracking-normal">{link.title}</Card.Title>
								<Card.Description class="leading-6">{link.description}</Card.Description>
							</Card.Header>
						</Card.Root>
					</a>
				{/each}
			</div>
		</div>
	</section>
</main>
