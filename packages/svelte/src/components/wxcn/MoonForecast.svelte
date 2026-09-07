<script lang="ts">
	import { onMount } from 'svelte';
	import MoonDisc from './MoonDisc.svelte';
	import * as Card from '../ui/card/index.js';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		MoonForecast as MoonData
	} from '@wxcn/core/types.js';
	import { sampleMoon } from '@wxcn/core/moon.js';
	let {
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
	const displayTimeZone = $derived(timeZone ?? visitorTimeZone);
	const date = (v: string) =>
		new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			timeZone: displayTimeZone
		}).format(new Date(v));
	const phase = $derived(forecast.age / 29.530588853);
</script>

<Card.Root
	style="container-type: inline-size"
	size={size === 'sm' ? 'sm' : 'default'}
	data-density={density}
	data-card-size={size}
	class={`min-w-0 overflow-hidden ${className}`}
>
	<Card.Header
		><Card.Title>Moon phase</Card.Title><Card.Description>{location.label}</Card.Description
		></Card.Header
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
</Card.Root>

<style>
	:global([data-density='compact']) .moon-data > div {
		padding-block: 0.4rem;
	}
</style>
