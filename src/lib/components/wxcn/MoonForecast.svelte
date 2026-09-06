<script lang="ts">
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
		class: className = '',
		iconType,
		location = { label: 'Austin, TX', latitude: 30.2672, longitude: -97.7431 },
		forecast = sampleMoon,
		sourceLabel = 'Lunar cycle estimate'
	}: {
		type?: ForecastType;
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
			timeZone: 'America/Chicago'
		}).format(new Date(v));
	const phase = $derived(forecast.age / 29.530588853);
	const moonId = $props.id();
</script>

<Card.Root class={`min-w-0 overflow-hidden ${className}`}>
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
	<Card.Content class="grid gap-5">
		<div class="flex items-center gap-6 rounded-lg border bg-muted/20 p-5">
			<svg
				viewBox="0 0 100 100"
				class="size-24 shrink-0"
				role="img"
				aria-label={`${forecast.phaseName}, ${forecast.illumination}% illuminated`}
			>
				<defs
					><radialGradient id={`${moonId}-light`} cx="35%" cy="30%"
						><stop stop-color="#f4f4f4" /><stop offset="1" stop-color="#999" /></radialGradient
					><clipPath id={`${moonId}-clip`}><circle cx="50" cy="50" r="46" /></clipPath></defs
				>
				<circle cx="50" cy="50" r="46" fill={`url(#${moonId}-light)`} />
				<g clip-path={`url(#${moonId}-clip)`} fill="#555" opacity=".22"
					><circle cx="33" cy="35" r="12" /><circle cx="63" cy="62" r="16" /><circle
						cx="72"
						cy="29"
						r="8"
					/><circle cx="30" cy="71" r="6" /><circle cx="47" cy="55" r="7" /></g
				>
				<path
					d={`M50 4 A46 46 0 0 ${phase < 0.5 ? 0 : 1} 50 96 A${Math.abs(Math.cos(phase * Math.PI * 2)) * 46} 46 0 0 ${Math.cos(phase * Math.PI * 2) > 0 ? (phase < 0.5 ? 0 : 1) : phase < 0.5 ? 1 : 0} 50 4`}
					fill="#171717"
				/>
			</svg>
			<div>
				<p class="text-2xl font-medium tracking-tight">{forecast.phaseName}</p>
				<p class="mt-2 text-sm text-muted-foreground">{forecast.illumination}% illuminated</p>
			</div>
		</div>
		{#if type !== 'simple'}<dl class="divide-y text-sm">
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
