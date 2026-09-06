<script lang="ts">
	import MoonDisc from './MoonDisc.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import ForecastIcon from '$lib/icons/forecast-icons.svelte';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		MoonForecast as MoonData
	} from '$lib/data/types.js';
	import { sampleMoon } from '$lib/data/moon.js';
	let {
		type = 'summary',
		size = 'default',
		density = 'comfortable',
		class: className = '',
		iconType,
		location = { label: 'Austin, TX', latitude: 30.2672, longitude: -97.7431 },
		forecast = sampleMoon,
		sourceLabel = 'Lunar cycle estimate'
	}: {
		type?: ForecastType;
		size?: 'sm' | 'default' | 'lg';
		density?: 'compact' | 'comfortable';
		class?: string;
		iconType?: IconSet;
		location?: LocationInput;
		forecast?: MoonData;
		sourceLabel?: string;
	} = $props();
	const date = (v: string) =>
		new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			timeZone: location.timeZone ?? 'UTC'
		}).format(new Date(v));
	const phase = $derived(forecast.age / 29.530588853);
</script>

<Card.Root
	size={size === 'sm' ? 'sm' : 'default'}
	data-density={density}
	data-card-size={size}
	class={`min-w-0 overflow-hidden ${className}`}
>
	<Card.Header
		><Card.Title>Moon phase</Card.Title><Card.Description>{location.label}</Card.Description
		><Card.Action
			><ForecastIcon
				name="moon"
				iconSet={iconType}
				class="size-5 text-muted-foreground"
			/></Card.Action
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
						: 'size-24 shrink-0'}
			/>
			<div>
				<p class={`font-medium tracking-tight ${size === 'sm' ? 'text-lg' : 'text-2xl'}`}>
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
		{#if type === 'detailed'}<p class="text-xs leading-5 text-muted-foreground">
				Estimated from a mean synodic month. Phase is shared worldwide; rise and set times require a
				location-specific ephemeris.
			</p>{/if}
	</Card.Content>
	<Card.Footer class="border-t text-xs text-muted-foreground"
		>{sourceLabel} · {date(forecast.date)}</Card.Footer
	>
</Card.Root>

<style>
	:global([data-density='compact']) .moon-data > div {
		padding-block: 0.4rem;
	}
</style>
