<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ForecastIcon from '$lib/icons/forecast-icons.svelte';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		MoonForecast as MoonForecastData
	} from '$lib/data/types.js';
	import { sampleMoon } from '$lib/data/moon.js';

	let {
		type = 'summary',
		iconType = 'lucide',
		location = { label: 'Local sky', latitude: 30.2672, longitude: -97.7431 },
		forecast = sampleMoon,
		sourceLabel = 'Local lunar cycle'
	}: {
		type?: ForecastType;
		iconType?: IconSet;
		location?: LocationInput;
		forecast?: MoonForecastData;
		sourceLabel?: string;
	} = $props();

	const synodicMonth = 29.530588853;
	const moonPhase = $derived(forecast.age / synodicMonth);
	const isWaxing = $derived(moonPhase < 0.5);
	const phasePath = $derived.by(() => {
		const illumination =
			Math.max(0, Math.min(100, forecast.illumination)) / 100;
		if (illumination <= 0.01) return '';
		if (illumination >= 0.99) return 'M 50 8 A 42 42 0 1 1 49.99 8 Z';

		if (isWaxing) {
			const controlX =
				illumination < 0.5
					? 50 + 84 * (1 - illumination * 2)
					: 50 - 84 * ((illumination - 0.5) * 2);
			return `M 50 8 A 42 42 0 1 1 50 92 Q ${controlX} 50 50 8 Z`;
		}

		const controlX =
			illumination < 0.5
				? 50 - 84 * (1 - illumination * 2)
				: 50 + 84 * ((illumination - 0.5) * 2);
		return `M 50 8 A 42 42 0 1 0 50 92 Q ${controlX} 50 50 8 Z`;
	});
	const phasePercent = $derived(Math.round(moonPhase * 100));
</script>

<Card.Root class="wxcn-shell">
	<Card.Content class="space-y-[var(--wxcn-gap)] p-[var(--wxcn-card-padding)]">
		<div class="wxcn-forecast-surface">
			<div class="flex items-start justify-between gap-3">
				<div class="space-y-1">
					<p class="wxcn-title text-xs font-semibold text-background/60">
						Moon Forecast
					</p>
					<h3
						class="flex items-center gap-2 text-base font-semibold tracking-normal"
					>
						<span
							class="flex size-8 items-center justify-center rounded-md border border-background/15 bg-background/10 text-primary shadow-sm"
						>
							<ForecastIcon name="moon" iconSet={iconType} class="size-4" />
						</span>
						{location.label}
					</h3>
				</div>
				<span class="wxcn-chip wxcn-inverted-chip">{sourceLabel}</span>
			</div>

			<div class="mt-4 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
				<div
					class="relative flex size-20 items-center justify-center rounded-md border border-background/15 bg-background/10 shadow-inner"
				>
					<div
						class="absolute inset-2 rounded-full border border-background/10"
					></div>
					<svg
						class="relative size-16 drop-shadow-[0_12px_22px_hsl(var(--primary)/0.24)]"
						viewBox="0 0 100 100"
						role="img"
						aria-label={`${forecast.phaseName}, ${forecast.illumination}% illuminated`}
					>
						<circle
							cx="50"
							cy="50"
							r="42"
							fill="hsl(var(--background) / 0.18)"
						/>
						{#if phasePath}
							<path d={phasePath} fill="hsl(var(--primary))" />
						{/if}
						<circle
							cx="34"
							cy="34"
							r="3.3"
							fill="hsl(var(--background) / 0.15)"
						/>
						<circle
							cx="62"
							cy="42"
							r="2.4"
							fill="hsl(var(--background) / 0.13)"
						/>
						<circle
							cx="48"
							cy="68"
							r="3.8"
							fill="hsl(var(--background) / 0.12)"
						/>
						<circle
							cx="50"
							cy="50"
							r="42"
							fill="none"
							stroke="hsl(var(--background) / 0.22)"
						/>
					</svg>
				</div>
				<div>
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-xl font-semibold tracking-normal">
							{forecast.phaseName}
						</p>
						<span class="wxcn-chip wxcn-inverted-chip"
							>{isWaxing ? 'waxing' : 'waning'}</span
						>
					</div>
					<p class="mt-1 text-xs text-background/65">
						{forecast.illumination}% illuminated · lunar age {forecast.age} days
					</p>
					<div class="mt-2 grid gap-1.5">
						<div class="flex justify-between text-xs text-background/55">
							<span>new</span>
							<span>full</span>
							<span>new</span>
						</div>
						<div
							class="relative h-2 overflow-hidden rounded-full bg-background/10"
						>
							<div class="h-full rounded-full bg-primary/45"></div>
							<div
								class="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/40 bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.65)]"
								style={`left: ${phasePercent}%`}
							></div>
						</div>
					</div>
				</div>
			</div>
		</div>

		{#if type === 'detailed'}
			<div class="grid gap-[var(--wxcn-gap)] sm:grid-cols-2">
				<div class="wxcn-kpi">
					<div class="flex items-center justify-between gap-3">
						<p class="wxcn-title text-xs text-muted-foreground">
							Next full moon
						</p>
						<Badge variant="outline">full</Badge>
					</div>
					<p class="mt-2 text-sm font-semibold">
						{new Intl.DateTimeFormat('en-US', {
							month: 'short',
							day: 'numeric',
							year: 'numeric'
						}).format(new Date(forecast.nextFullMoon))}
					</p>
				</div>
				<div class="wxcn-kpi">
					<div class="flex items-center justify-between gap-3">
						<p class="wxcn-title text-xs text-muted-foreground">
							Next new moon
						</p>
						<Badge variant="outline">new</Badge>
					</div>
					<p class="mt-2 text-sm font-semibold">
						{new Intl.DateTimeFormat('en-US', {
							month: 'short',
							day: 'numeric',
							year: 'numeric'
						}).format(new Date(forecast.nextNewMoon))}
					</p>
				</div>
			</div>
		{/if}

		{#if type === 'detailed'}
			<p
				class="rounded-lg border bg-muted/40 p-[var(--wxcn-item-padding)] text-xs leading-5 text-muted-foreground"
			>
				The lunar estimate is calculated locally from the synodic month, so no
				API key or hosted moon endpoint is needed for commercial deployments.
			</p>
		{/if}
	</Card.Content>
</Card.Root>
