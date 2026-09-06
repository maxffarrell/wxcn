<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, Svg, Area } from 'layerchart';
	import { curveMonotoneX } from 'd3-shape';
	import * as Card from '$lib/components/ui/card/index.js';
	import ForecastIcon from '$lib/icons/forecast-icons.svelte';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		TidePrediction,
		TideUnit,
		TidePoint,
		TideReading
	} from '$lib/data/types.js';
	import { sampleTides, sampleTideSeries, sampleTideTime } from '$lib/data/tides.js';
	import { tideState, tideTimestamp } from '$lib/data/tide-state.js';
	let {
		type = 'summary',
		size = 'default',
		density = 'comfortable',
		class: className = '',
		unit = 'ft',
		iconType,
		location = {
			label: 'Galveston Pier 21, TX',
			latitude: 29.31,
			longitude: -94.7933,
			station: '8771450',
			timeZone: 'America/Chicago'
		},
		predictions = sampleTides,
		example = predictions === sampleTides,
		series,
		reading = null,
		at,
		sourceLabel = 'Sample tides · station time'
	}: {
		type?: ForecastType;
		size?: 'sm' | 'default' | 'lg';
		density?: 'compact' | 'comfortable';
		class?: string;
		unit?: TideUnit;
		iconType?: IconSet;
		location?: LocationInput;
		predictions?: TidePrediction[];
		example?: boolean;
		series?: TidePoint[];
		reading?: TideReading | null;
		at?: number;
		sourceLabel?: string;
	} = $props();
	let clock = $state(Date.now());
	onMount(() => {
		clock = Date.now();
		const timer = setInterval(() => (clock = Date.now()), 60000);
		return () => clearInterval(timer);
	});
	const isSample = $derived(example);
	const now = $derived(at ?? (isSample ? sampleTideTime : clock));
	const tide = $derived(
		tideState(predictions, series ?? (isSample ? sampleTideSeries : []), reading, now)
	);
	const chartData = $derived(
		(tide.points.length
			? tide.points
			: tide.events.map((p) => ({ time: tideTimestamp(p.time), height: Number(p.height) }))
		).filter((p) => p.time >= now - 12 * 3600000 && p.time <= now + 18 * 3600000)
	);
	const markerTime = $derived(tide.observed ? tideTimestamp(tide.observed.time) : now);
	const domain = $derived.by(() => {
		const v = chartData.map((p) => p.height);
		if (tide.level !== null) v.push(tide.level);
		const lo = Math.min(...v),
			hi = Math.max(...v);
		return [lo - Math.max(0.15, (hi - lo) * 0.2), hi + Math.max(0.15, (hi - lo) * 0.2)];
	});
	const height = (value: number) => (value * (unit === 'meter' ? 0.3048 : 1)).toFixed(1);
	const symbol = $derived(unit === 'meter' ? 'm' : 'ft');
	const time = (value: string | number) =>
		new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			timeZone: location.timeZone ?? 'UTC'
		}).format(typeof value === 'string' ? tideTimestamp(value) : value);
	const dateTime = (p: TidePrediction) =>
		new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			timeZone: location.timeZone ?? 'UTC'
		}).format(tideTimestamp(p.time));
</script>

<Card.Root
	style="container-type: inline-size"
	size={size === 'sm' ? 'sm' : 'default'}
	data-density={density}
	data-card-size={size}
	class={`min-w-0 overflow-hidden ${className}`}
>
	<Card.Header
		><Card.Title>Tides</Card.Title><Card.Description>{location.label}</Card.Description><Card.Action
			><ForecastIcon
				name="tide"
				iconSet={iconType}
				class="size-5 text-muted-foreground"
			/></Card.Action
		></Card.Header
	>
	<Card.Content class={density === 'compact' ? 'grid gap-3' : 'grid gap-5'}>
		{#if tide.events.length || tide.points.length}
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p class="mb-1 text-xs text-muted-foreground">
						{isSample
							? 'Example water level'
							: tide.observed
								? 'Current water level'
								: tide.predicted !== null
									? 'Predicted water level'
									: 'Current reading unavailable'}
					</p>
					<p
						style="font-size:clamp(1.5rem,12cqw,2.5rem)"
						class={`${size === 'sm' ? 'text-3xl' : 'text-4xl'} font-medium tracking-tight tabular-nums`}
					>
						{tide.level === null ? '—' : height(tide.level)}<span
							class="ml-1 text-sm text-muted-foreground">{symbol}</span
						>
					</p>
				</div>
				<div class="text-right text-xs text-muted-foreground">
					<p>
						{tide.next
							? tide.next.type === 'H'
								? 'Rising toward high tide'
								: 'Falling toward low tide'
							: 'Tide outlook'}
					</p>
					<p class="mt-1">{tide.observed ? 'Observed ' : ''}{time(markerTime)}</p>
				</div>
			</div>
			{#if chartData.length > 1}
				<div
					class={size === 'sm' ? 'h-20' : size === 'lg' ? 'h-36' : 'h-28'}
					role="img"
					aria-label="Tide prediction curve with current water level marker"
				>
					<Chart
						data={chartData}
						x="time"
						y="height"
						yDomain={domain}
						padding={{ top: 8, right: 8, bottom: 4, left: 8 }}
					>
						{#snippet children({ context })}
							<Svg>
								<Area
									curve={curveMonotoneX}
									fill="var(--chart-1, var(--primary))"
									opacity={0.12}
									line={{
										stroke: 'var(--chart-1, var(--primary))',
										strokeWidth: 2,
										fill: 'none',
										opacity: 1
									}}
									motion={{ type: 'tween', duration: 0 }}
								/>
								{#if tide.level !== null && markerTime >= chartData[0].time && markerTime <= chartData[chartData.length - 1].time}
									<line
										x1={context.xScale(markerTime)}
										x2={context.xScale(markerTime)}
										y1={0}
										y2={context.height}
										stroke="var(--muted-foreground)"
										stroke-dasharray="3 4"
									/>
									<circle
										data-slot="current-tide-marker"
										cx={context.xScale(markerTime)}
										cy={context.yScale(tide.level)}
										r={4.5}
										fill="var(--chart-1, var(--primary))"
										stroke="var(--card)"
										stroke-width="2"
									/>
								{/if}
							</Svg>
						{/snippet}
					</Chart>
				</div>
				<div class="-mt-2 flex justify-between text-[10px] text-muted-foreground">
					<span>{time(chartData[0].time)}</span><span
						>MLLW · {tide.points.length ? 'predicted curve' : 'extrema only'}</span
					><span>{time(chartData.at(-1)!.time)}</span>
				</div>
			{/if}
			<div class="grid grid-cols-2 gap-3 border-t pt-3">
				{#each [{ label: 'Previous', event: tide.previous }, { label: 'Next', event: tide.next }] as entry}
					<div>
						<p class="text-xs text-muted-foreground">
							{entry.label}
							{entry.event ? (entry.event.type === 'H' ? 'high tide' : 'low tide') : 'tide'}
						</p>
						<p class="mt-1 text-sm font-medium tabular-nums">
							{entry.event ? time(entry.event.time) : 'Unavailable'}
						</p>
						{#if entry.event}<p class="mt-1 text-xs text-muted-foreground">
								{height(Number(entry.event.height))}
								{symbol}
							</p>{/if}
					</div>
				{/each}
			</div>
			{#if type !== 'simple'}
				<div class="divide-y border-t">
					{#each tide.events
						.filter((p) => tideTimestamp(p.time) > now)
						.slice(0, type === 'detailed' ? 6 : density === 'compact' ? 2 : 4) as event}<div
							class={`flex justify-between gap-2 text-xs ${density === 'compact' ? 'py-2' : 'py-3'}`}
						>
							<span>{event.type === 'H' ? 'High tide' : 'Low tide'}</span><span
								class="ml-auto text-muted-foreground">{dateTime(event)}</span
							><span class="tabular-nums">{height(Number(event.height))} {symbol}</span>
						</div>{/each}
				</div>
			{/if}
		{:else}<p role="status" class="py-8 text-center text-sm text-muted-foreground">
				No tide predictions available.
			</p>{/if}
	</Card.Content>
	<Card.Footer class="border-t text-xs text-muted-foreground">{sourceLabel}</Card.Footer>
</Card.Root>
