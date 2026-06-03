<script module>
	export { default as WeatherForecast } from '$lib/components/wxcn/WeatherForecast.svelte';
	export { default as TideForecast } from '$lib/components/wxcn/TideForecast.svelte';
	export { default as MoonForecast } from '$lib/components/wxcn/MoonForecast.svelte';
	export { default as ForecastDashboard } from '$lib/components/wxcn/ForecastDashboard.svelte';
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="container grid gap-6 py-10 lg:grid-cols-[260px_1fr]">
	<aside class="hidden lg:block">
		<Card.Root class="sticky top-24 overflow-hidden">
			<Card.Header class="wxcn-card-header">
				<Card.Title class="wxcn-title text-base">wxcn docs</Card.Title>
				<Card.Description>Forecast registry kit</Card.Description>
			</Card.Header>
			<Card.Content class="grid gap-2 pt-5">
				<a class="rounded-lg border bg-muted px-3 py-2 text-sm font-medium" href="/docs/components">Components</a>
				<a class="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground" href="/docs/endpoints">Endpoints</a>
				<a class="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground" href="/registry">Registry</a>
			</Card.Content>
		</Card.Root>
	</aside>
	<Card.Root class="wxcn-shell">
		<Card.Header class="wxcn-card-header">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<Card.Title class="wxcn-title">Documentation</Card.Title>
					<Card.Description>MDSX-authored examples with live Svelte previews.</Card.Description>
				</div>
				<Badge>live cards</Badge>
			</div>
		</Card.Header>
		<Card.Content class="wxcn-docs p-6 sm:p-8">
			{@render children()}
		</Card.Content>
	</Card.Root>
</div>
