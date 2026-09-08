<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import MoonDisc from './MoonDisc.svelte';
	import * as Card from '../ui/card/index.js';
	import ForecastScreens from './ForecastScreens.svelte';
	import { forecastDays, type ForecastDay } from '@wxcn/core/forecast-days.js';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		MoonForecast as MoonData
	} from '@wxcn/core/types.js';
	import { sampleMoon, getMoonForecast, getUpcomingMoonPhases } from '@wxcn/core/moon.js';
	let {
		interactive = false,
		timeZone,
		type = 'summary',
		size = 'default',
		density = 'comfortable',
		class: className = '',
		iconType,
		location = { label: 'Austin, TX', latitude: 30.2672, longitude: -97.7431 },
		forecast = sampleMoon,
		sourceLabel = ''
	}: {
		interactive?: boolean;
		timeZone?: string;
		type?: ForecastType;
		size?: 'sm' | 'default' | 'lg';
		density?: 'compact' | 'comfortable';
		class?: string;
		iconType?: IconSet;
		location?: LocationInput;
		forecast?: MoonData;
		sourceLabel?: string;
	} = $props();
	let visitorTimeZone = $state('UTC');
	onMount(() => {
		visitorTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	});
	const displayTimeZone = $derived(timeZone ?? location.timeZone ?? visitorTimeZone);
	const date = (v: string) =>
		new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			timeZone: displayTimeZone
		}).format(new Date(v));
	const phases = $derived(getUpcomingMoonPhases(new Date(forecast.date)));
	const days = $derived(
		forecastDays(
			phases.map((value) => ({
				time: Date.parse(value.date),
				label: value.phaseName,
				summary: `${value.illumination}% illuminated`,
				details: ''
			})),
			displayTimeZone
		)
	);
</script>

{#snippet cardView(day: ForecastDay | undefined, action: Snippet<[boolean]>)}
	{@const view = day
		? day.entries[0].time === Date.parse(forecast.date)
			? forecast
			: getMoonForecast(new Date(day.entries[0].time))
		: forecast}
	<Card.Header
		><Card.Title>{day?.label ?? 'Moon phase'}</Card.Title><Card.Description
			>{location.label}</Card.Description
		>{@render action(false)}</Card.Header
	>
	<Card.Content class={density === 'compact' ? 'grid gap-3' : 'grid gap-5'}>
		<div
			class={`flex items-center gap-4 ${size === 'lg' ? 'flex-col rounded-lg bg-muted/20 p-5 text-center' : ''}`}
		>
			<MoonDisc
				phase={view.phase ?? view.age / 29.530588853}
				label={`${view.phaseName}, ${view.illumination}% illuminated`}
				class={size === 'sm'
					? 'size-16 shrink-0'
					: size === 'lg'
						? 'size-36 shrink-0'
						: 'size-24 max-w-[28cqw] shrink-0'}
			/>
			<div>
				<p
					style="font-size:clamp(1rem,6cqw,1.5rem)"
					class={`font-medium tracking-tight ${size === 'sm' ? 'text-lg' : 'text-2xl'}`}
				>
					{view.phaseName}
				</p>
				<p class="mt-2 text-sm text-muted-foreground">{view.illumination}% illuminated</p>
			</div>
		</div>
		{#if type !== 'simple'}<dl class="moon-data divide-y text-sm">
				<div class="flex justify-between gap-4 pb-3">
					<dt class="text-muted-foreground">Moon age</dt>
					<dd>{view.age} days</dd>
				</div>
				<div class="flex justify-between gap-4 py-3">
					<dt class="text-muted-foreground">Next full moon</dt>
					<dd>{date(view.nextFullMoon)}</dd>
				</div>
				<div class="flex justify-between gap-4 pt-3">
					<dt class="text-muted-foreground">Next new moon</dt>
					<dd>{date(view.nextNewMoon)}</dd>
				</div>
			</dl>{/if}

		{#if !day && sourceLabel}<p class="text-[10px] text-muted-foreground">
				{sourceLabel} · {date(view.date)}
			</p>{/if}
	</Card.Content>
{/snippet}

<Card.Root
	style="container-type: inline-size"
	size={size === 'sm' ? 'sm' : 'default'}
	data-density={density}
	data-card-size={size}
	class={`relative isolate min-w-0 overflow-hidden ${className}`}
>
	<ForecastScreens
		{interactive}
		{days}
		title="Moon"
		{density}
		{sourceLabel}
		{iconType}
		actionLabel="Next phases"
		summaryTitle="Next phases"
	>
		{#snippet summary(availableHeight)}
			<div
				class="grid h-full auto-rows-[minmax(32px,1fr)] overflow-y-auto"
				data-slot="upcoming-moon-phases"
			>
				{#each phases as phase}
					<div class="flex min-h-0 items-center gap-3 border-b text-xs last:border-0">
						<div
							class="shrink-0"
							style={`width: ${Math.max(16, Math.min(32, availableHeight / 7 - 4))}px`}
						>
							<MoonDisc phase={phase.phase} label={phase.phaseName} class="size-full" />
						</div>
						<span class="min-w-0 flex-1 font-medium">{phase.phaseName}</span>
						<time datetime={phase.date} class="shrink-0 text-muted-foreground"
							>{date(phase.date)}</time
						>
					</div>
				{/each}
			</div>
		{/snippet}
		{#snippet children(openDay, action, visible)}
			{@render cardView(undefined, action)}
		{/snippet}
		{#snippet detail(day, action)}
			{@render cardView(day, action)}
		{/snippet}
	</ForecastScreens>
</Card.Root>

<style>
	:global([data-density='compact']) .moon-data > div {
		padding-block: 0.4rem;
	}
</style>
