<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import ForecastIcon from '$lib/icons/forecast-icons.svelte';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		TidePrediction,
		TideUnit
	} from '$lib/data/types.js';
	import { sampleTides } from '$lib/data/tides.js';
	let {
		type = 'summary',
		class: className = '',
		unit = 'ft',
		iconType,
		location = {
			label: 'Galveston Pier 21, TX',
			latitude: 29.31,
			longitude: -94.7933,
			station: '8771450'
		},
		predictions = sampleTides,
		sourceLabel = 'Sample tides · station time'
	}: {
		type?: ForecastType;
		class?: string;
		unit?: TideUnit;
		iconType?: IconSet;
		location?: LocationInput;
		predictions?: TidePrediction[];
		sourceLabel?: string;
	} = $props();
	const visible = $derived(
		predictions.slice(0, type === 'simple' ? 2 : type === 'detailed' ? 8 : 4)
	);
	const height = (p: TidePrediction) =>
		(Number(p.height) * (unit === 'meter' ? 0.3048 : 1)).toFixed(1);
	const time = (p: TidePrediction) => p.time.slice(11, 16);
	const chart = $derived.by(() => {
		const values = visible.map((p) => Number(p.height));
		const min = Math.min(...values);
		const range = Math.max(0.1, Math.max(...values) - min);
		const points = values.map((v, i) => ({
			x: 10 + (i * 280) / Math.max(1, values.length - 1),
			y: 70 - ((v - min) / range) * 50
		}));
		return points
			.map((p, i) =>
				i
					? `C ${points[i - 1].x + (p.x - points[i - 1].x) / 2} ${points[i - 1].y}, ${p.x - (p.x - points[i - 1].x) / 2} ${p.y}, ${p.x} ${p.y}`
					: `M ${p.x} ${p.y}`
			)
			.join(' ');
	});
</script>

<Card.Root class={`min-w-0 overflow-hidden ${className}`}>
	<Card.Header
		><Card.Title>Tides</Card.Title><Card.Description>{location.label}</Card.Description><Card.Action
			><ForecastIcon
				name="tide"
				iconSet={iconType}
				class="size-5 text-muted-foreground"
			/></Card.Action
		></Card.Header
	>
	<Card.Content class="grid gap-4">
		{#if visible.length}
			<div class="flex items-baseline justify-between">
				<p class="text-sm text-muted-foreground">
					First {visible[0].type === 'H' ? 'high' : 'low'} tide
				</p>
				<p class="text-3xl font-medium tracking-tight tabular-nums">
					{height(visible[0])}<span class="ml-1 text-sm text-muted-foreground"
						>{unit === 'meter' ? 'm' : 'ft'}</span
					>
				</p>
			</div>
			<svg
				viewBox="0 0 300 90"
				class="h-24 w-full text-primary"
				role="img"
				aria-label="Schematic of supplied tide predictions"
				><path
					d="M10 75H290 M10 45H290 M10 15H290"
					stroke="var(--border)"
					stroke-dasharray="3 4"
				/><path d={chart} fill="none" stroke="currentColor" stroke-width="2" /></svg
			>
			<div class="divide-y border-t">
				{#each visible as p, i (`${p.time}-${i}`)}<div
						class="flex items-center justify-between gap-3 py-3 text-sm"
					>
						<span>{p.type === 'H' ? 'High tide' : 'Low tide'}</span><span
							class="ml-auto text-muted-foreground tabular-nums">{time(p)}</span
						><span class="min-w-14 text-right tabular-nums"
							>{height(p)} {unit === 'meter' ? 'm' : 'ft'}</span
						>
					</div>{/each}
			</div>
			{#if type === 'detailed'}<p class="text-xs leading-5 text-muted-foreground">
					MLLW datum. The curve connects supplied extrema and is not a continuous water-level
					prediction.
				</p>{/if}
		{:else}<p role="status" class="py-8 text-center text-sm text-muted-foreground">
				No tide predictions available.
			</p>{/if}
	</Card.Content>
	<Card.Footer class="border-t text-xs text-muted-foreground">{sourceLabel}</Card.Footer>
</Card.Root>
