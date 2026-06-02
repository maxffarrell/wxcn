<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import ForecastDashboard from '$lib/components/wxcn/ForecastDashboard.svelte';
	import WeatherShaderBackground, {
		type WeatherShaderMode
	} from '$lib/components/wxcn/WeatherShaderBackground.svelte';

	const shaderScenes: {
		mode: WeatherShaderMode;
		label: string;
		description: string;
	}[] = [
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
		}
	];

	const links = [
		{
			title: 'Components',
			description: 'Weather, tide, and moon registry cards.',
			href: '/docs/components'
		},
		{
			title: 'Endpoints',
			description: 'Commercial-safe data sources and loading notes.',
			href: '/docs/endpoints'
		},
		{
			title: 'Registry',
			description: 'Browse the generated shadcn-svelte registry output.',
			href: '/registry'
		}
	];
</script>

<svelte:head>
	<title>wxcn-svelte</title>
	<meta
		name="description"
		content="shadcn-svelte registry components for weather, tides, and moon forecasts."
	/>
</svelte:head>

<main>
	<section class="border-b">
		<div class="container max-w-6xl py-14 md:py-20">
			<div class="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
				<div class="max-w-2xl">
					<p class="mb-3 text-sm font-medium text-muted-foreground">
						shadcn-svelte registry
					</p>
					<h1
						class="text-4xl font-semibold leading-tight tracking-normal text-balance md:text-5xl"
					>
						Weather, tide, and moon forecast cards.
					</h1>
					<p class="mt-4 text-base leading-7 text-muted-foreground">
						Copy forecast components into your SvelteKit app with typed props
						for density, icon family, units, location, and animated weather
						backgrounds.
					</p>
					<div class="mt-6 flex flex-wrap gap-3">
						<a href="/docs/components"><Button>Get started</Button></a>
						<a href="/registry"><Button variant="outline">View registry</Button></a>
					</div>
					<div class="mt-8 rounded-lg border bg-muted/40 p-3 font-mono text-sm">
						pnpm dlx shadcn-svelte@latest add
						<span class="text-muted-foreground"> https://wxcn.dev/registry.json</span>
					</div>
				</div>

				<div class="rounded-lg border bg-muted/20 p-3">
					<ForecastDashboard
						type="summary"
						iconType="lucide"
						animatedWeatherBackground
					/>
				</div>
			</div>
		</div>
	</section>

	<section class="border-b">
		<div class="container max-w-6xl py-12">
			<div class="grid gap-8 lg:grid-cols-[18rem_1fr]">
				<div>
					<h2 class="text-2xl font-semibold tracking-normal">
						Animated weather backgrounds
					</h2>
					<p class="mt-2 text-sm leading-6 text-muted-foreground">
						The weather card can render live WebGL shaders for current
						conditions without adding a separate canvas API.
					</p>
				</div>
				<div class="grid gap-3 md:grid-cols-3">
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
			</div>
		</div>
	</section>

	<section>
		<div class="container max-w-6xl py-12">
			<div class="grid gap-4 md:grid-cols-3">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="rounded-lg border bg-card p-5 transition-colors hover:bg-muted/40"
					>
						<h3 class="font-semibold tracking-normal">{link.title}</h3>
						<p class="mt-2 text-sm leading-6 text-muted-foreground">
							{link.description}
						</p>
					</a>
				{/each}
			</div>
		</div>
	</section>
</main>
