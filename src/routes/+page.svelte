<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ForecastDashboard from '$lib/components/wxcn/ForecastDashboard.svelte';
	import WeatherForecast from '$lib/components/wxcn/WeatherForecast.svelte';
	import TideForecast from '$lib/components/wxcn/TideForecast.svelte';
	import MoonForecast from '$lib/components/wxcn/MoonForecast.svelte';
</script>

<svelte:head>
	<title>wxcn-svelte</title>
	<meta
		name="description"
		content="shadcn-svelte registry components for weather, tides, and moon forecasts."
	/>
</svelte:head>

<main>
	<section class="border-b wxcn-page-grid">
		<div class="container grid min-h-[calc(100vh-4rem)] gap-10 py-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
			<div class="space-y-7">
				<div class="flex flex-wrap gap-2">
					<Badge>shadcn-svelte registry</Badge>
					<Badge variant="outline">NWS + NOAA</Badge>
					<Badge variant="secondary">MDSX docs</Badge>
				</div>
				<div class="space-y-4">
					<h1 class="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-normal sm:text-5xl lg:text-6xl">
						Forecast cards that respect your shadcn-svelte style.
					</h1>
					<p class="max-w-2xl text-lg leading-8 text-muted-foreground">
						Drop in forecast components with typed props for display density, icon family, location,
						station ids, and source data.
					</p>
				</div>
				<div class="grid max-w-xl grid-cols-3 gap-3">
					<div class="wxcn-metric">
						<p class="text-2xl font-semibold">3</p>
						<p class="wxcn-title text-xs text-muted-foreground">forecast domains</p>
					</div>
					<div class="wxcn-metric">
						<p class="text-2xl font-semibold">5</p>
						<p class="wxcn-title text-xs text-muted-foreground">icon families</p>
					</div>
					<div class="wxcn-metric">
						<p class="text-2xl font-semibold">0</p>
						<p class="wxcn-title text-xs text-muted-foreground">API keys</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-3">
					<a href="/docs/components"><Button>Install components</Button></a>
					<a href="/registry"><Button variant="outline">Open registry</Button></a>
				</div>
			</div>
			<div class="relative grid gap-4">
				<WeatherForecast type="summary" iconType="hugeicons" animatedBackground />
			</div>
		</div>
	</section>

	<section class="container py-10">
		<div class="mb-6 flex items-end justify-between gap-4">
			<div>
				<h2 class="text-2xl font-semibold tracking-normal">Registry showcase</h2>
				<p class="mt-2 text-sm text-muted-foreground">
					Every preview is rendered with the same shadcn-svelte card primitives shipped in the registry.
				</p>
			</div>
		</div>
		<ForecastDashboard
			type="summary"
			iconType="lucide"
			animatedWeatherBackground
		/>
	</section>

	<section class="container grid gap-4 pb-14 lg:grid-cols-3">
		<Card.Root class="wxcn-shell">
			<Card.Header>
				<Card.Title>Weather</Card.Title>
				<Card.Description>NWS forecasts from api.weather.gov for United States points.</Card.Description>
			</Card.Header>
			<Card.Content>
				<WeatherForecast
					type="simple"
					iconType="phosphor-svelte"
					animatedBackground
				/>
			</Card.Content>
		</Card.Root>
		<Card.Root class="wxcn-shell">
			<Card.Header>
				<Card.Title>Tides</Card.Title>
				<Card.Description>NOAA CO-OPS tide predictions by station id.</Card.Description>
			</Card.Header>
			<Card.Content>
				<TideForecast type="simple" iconType="tabler" />
			</Card.Content>
		</Card.Root>
		<Card.Root class="wxcn-shell">
			<Card.Header>
				<Card.Title>Moon</Card.Title>
				<Card.Description>Local lunar cycle calculations without API keys.</Card.Description>
			</Card.Header>
			<Card.Content>
				<MoonForecast type="simple" iconType="remix" />
			</Card.Content>
		</Card.Root>
	</section>
</main>
