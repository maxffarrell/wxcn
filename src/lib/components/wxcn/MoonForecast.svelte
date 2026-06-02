<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
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
		location = { label: 'Today', latitude: 34.0195, longitude: -118.4912 },
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
	const phasePercent = $derived(Math.round(moonPhase * 100));
	const nextFullMoonDate = $derived(
		new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(forecast.nextFullMoon))
	);
</script>

<Card.Root class="wxcn-shell wxcn-widget-card">
	<Card.Content class="p-0">
		<div class="wxcn-widget-header">
			<div class="flex items-start gap-3">
				<span class="wxcn-widget-icon">
					<ForecastIcon name="moon" iconSet={iconType} class="size-5" />
				</span>
				<div>
					<h3 class="text-lg font-semibold leading-none tracking-normal">
						Moon Phase
					</h3>
					<p class="mt-1.5 text-sm text-muted-foreground">{location.label}</p>
				</div>
			</div>
			<span class="text-2xl leading-none text-foreground/80">›</span>
		</div>

		<div class="px-5 pb-5">
			<div class="flex flex-col items-center pt-5">
				<div
					class="wxcn-photo-moon"
					style={`--wxcn-moon-light: ${Math.max(8, Math.min(92, forecast.illumination))}%; --wxcn-moon-shift: ${isWaxing ? '-18%' : '18%'}`}
					role="img"
					aria-label={`${forecast.phaseName}, ${forecast.illumination}% illuminated`}
				></div>
				<h4 class="mt-6 text-center text-3xl font-semibold tracking-normal">
					{forecast.phaseName}
				</h4>
				<p class="mt-2 text-center text-lg text-muted-foreground">
					{forecast.illumination}% Illuminated
				</p>
			</div>

			<div class="mt-7 divide-y border-t">
				<div class="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3 text-sm">
					<span class="text-2xl text-muted-foreground">↑</span>
					<span class="text-muted-foreground">Moonrise</span>
					<span class="wxcn-tabular font-medium">12:46 PM</span>
				</div>
				<div class="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3 text-sm">
					<span class="text-2xl text-muted-foreground">↓</span>
					<span class="text-muted-foreground">Moonset</span>
					<span class="wxcn-tabular font-medium">12:11 AM</span>
				</div>
				<div class="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3 text-sm">
					<span class="text-muted-foreground">◉</span>
					<span class="text-muted-foreground">Moon Direction</span>
					<span class="wxcn-tabular font-medium">SE 135°</span>
				</div>
				<div class="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3 text-sm">
					<span class="text-muted-foreground">○</span>
					<span class="text-muted-foreground">Next Full Moon</span>
					<span class="wxcn-tabular font-medium">{nextFullMoonDate}</span>
				</div>
			</div>

			{#if type === 'detailed'}
				<div class="mt-4">
					<div class="flex justify-between text-xs text-muted-foreground">
						<span>new</span>
						<span>full</span>
						<span>new</span>
					</div>
					<div class="relative mt-2 h-2 overflow-hidden rounded-full bg-muted">
						<div class="h-full rounded-full bg-primary/35"></div>
						<div
							class="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-primary shadow-sm"
							style={`left: ${phasePercent}%`}
						></div>
					</div>
					<p class="mt-3 text-xs leading-5 text-muted-foreground">
						{sourceLabel} estimates the phase locally from the synodic month.
					</p>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
