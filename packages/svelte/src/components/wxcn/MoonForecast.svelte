<script lang="ts">
	import { onMount } from 'svelte';
	import MoonDisc from './MoonDisc.svelte';
	import * as Card from '../ui/card/index.js';
	import ForecastScreens from './ForecastScreens.svelte';
	import ForecastIcon from '../../icons/forecast-icons.svelte';
	import { forecastDays } from '@wxcn/core/forecast-days.js';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		MoonForecast as MoonData
	} from '@wxcn/core/types.js';
	import { sampleMoon, getMoonForecast } from '@wxcn/core/moon.js';
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
	const phase = $derived(forecast.age / 29.530588853);
	const days = $derived(
		forecastDays(
			Array.from({ length: 7 }, (_, index) => {
				const value =
					index === 0
						? forecast
						: getMoonForecast(new Date(Date.parse(forecast.date) + index * 86400000));
				return {
					time: Date.parse(value.date),
					label: value.phaseName,
					summary: `${value.illumination}% illuminated`,
					details: `Moon age: ${value.age} days. Next full moon: ${date(value.nextFullMoon)}. Next new moon: ${date(value.nextNewMoon)}.`
				};
			}),
			displayTimeZone
		)
	);
</script>

<Card.Root
	style="container-type: inline-size"
	size={size === 'sm' ? 'sm' : 'default'}
	data-density={density}
	data-card-size={size}
	class={`relative isolate min-w-0 overflow-hidden ${className}`}
>
	<ForecastScreens {interactive} {days} title="Moon" {density} {sourceLabel} {iconType}>
		{#snippet children(openDay, weekAction)}
			<Card.Header
				><Card.Title>Moon phase</Card.Title><Card.Description>{location.label}</Card.Description
				>{@render weekAction(false)}</Card.Header
			>
			<Card.Content class={density === 'compact' ? 'grid gap-3' : 'grid gap-5'}>
				<div
					class={`flex items-center gap-4 ${size === 'lg' ? 'flex-col rounded-lg bg-muted/20 p-5 text-center' : ''}`}
				>
					<MoonDisc
						{phase}
						label={`${forecast.phaseName}, ${forecast.illumination}% illuminated`}
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
							{forecast.phaseName}
						</p>
						<p class="mt-2 text-sm text-muted-foreground">{forecast.illumination}% illuminated</p>
					</div>
				</div>
				{#if type !== 'simple'}<dl class="moon-data divide-y text-sm">
						<div class="flex justify-between gap-4 pb-3">
							<dt class="text-muted-foreground">Moon age</dt>
							<dd>{forecast.age} days</dd>
						</div>
						<div class="flex justify-between gap-4 py-3">
							<dt class="text-muted-foreground">Next full moon</dt>
							<dd>{date(forecast.nextFullMoon)}</dd>
						</div>
						<div class="flex justify-between gap-4 pt-3">
							<dt class="text-muted-foreground">Next new moon</dt>
							<dd>{date(forecast.nextNewMoon)}</dd>
						</div>
					</dl>{/if}

				{#if sourceLabel}<p class="text-[10px] text-muted-foreground">
						{sourceLabel} · {date(forecast.date)}
					</p>{/if}
			</Card.Content>
		{/snippet}
		{#snippet detail(day)}
			{@const value =
				day.entries[0].time === Date.parse(forecast.date)
					? forecast
					: getMoonForecast(new Date(day.entries[0].time))}
			<div class={density === 'compact' ? 'grid gap-3' : 'grid gap-5'} data-slot="moon-day-detail">
				<div class="flex items-center gap-4 py-2">
					<MoonDisc
						phase={value.age / 29.530588853}
						label={value.phaseName}
						class="size-20 max-w-[28cqw] shrink-0"
					/>
					<div>
						<p class="text-lg font-medium tracking-tight">{value.phaseName}</p>
						<p class="mt-2 text-xs text-muted-foreground">{value.illumination}% illuminated</p>
					</div>
				</div>
				<dl class="moon-data divide-y text-sm">
					<div class="flex items-center justify-between gap-3 pb-3">
						<dt class="flex items-center gap-2 text-xs text-muted-foreground">
							<ForecastIcon name="moon" iconSet={iconType} class="size-4" />Moon age
						</dt>
						<dd class="tabular-nums">{value.age} days</dd>
					</div>
					<div class="flex items-center justify-between gap-3 py-3">
						<dt class="flex items-center gap-2 text-xs text-muted-foreground">
							<MoonDisc phase={0.5} class="size-4" label="Full moon" />Next full moon
						</dt>
						<dd>{date(value.nextFullMoon)}</dd>
					</div>
					<div class="flex items-center justify-between gap-3 pt-3">
						<dt class="flex items-center gap-2 text-xs text-muted-foreground">
							<MoonDisc phase={0} class="size-4" label="New moon" />Next new moon
						</dt>
						<dd>{date(value.nextNewMoon)}</dd>
					</div>
				</dl>
			</div>
		{/snippet}
	</ForecastScreens>
</Card.Root>

<style>
	:global([data-density='compact']) .moon-data > div {
		padding-block: 0.4rem;
	}
</style>
